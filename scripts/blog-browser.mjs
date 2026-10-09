// Optional browser coverage using an installed Chrome/Edge and the DevTools
// protocol. No browser automation dependency is added to the application.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { once } from "node:events";
import { join, resolve } from "node:path";
import sharp from "sharp";

export async function checkBlogBrowser({
  origin,
  cookie,
  directory,
  development = false,
}) {
  const executable = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  if (!executable) {
    console.log("Browser checks skipped: Chrome/Edge not installed.");
    return;
  }
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const port = listener.address().port;
  await new Promise((done) => listener.close(done));
  const browser = spawn(
    executable,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--disable-background-networking",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${join(directory, "browser-profile")}`,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let socket;
  try {
    let targets;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        targets = await (
          await fetch(`http://127.0.0.1:${port}/json/list`)
        ).json();
        if (targets.some((target) => target.type === "page")) break;
      } catch {
        /* Chrome starting. */
      }
      await new Promise((done) => setTimeout(done, 250));
    }
    const target = targets?.find((item) => item.type === "page");
    assert.ok(target, "Browser failed to start.");
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((done, reject) => {
      socket.addEventListener("open", done, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    let id = 0;
    const pending = new Map();
    const errors = [];
    let interceptedDrag = null;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.method === "Input.dragIntercepted") interceptedDrag = message.params.data;
      if (message.method === "Runtime.exceptionThrown")
        errors.push(
          message.params.exceptionDetails.exception?.description ||
            message.params.exceptionDetails.text,
        );
      const item = pending.get(message.id);
      if (item) {
        clearTimeout(item.timeout);
        pending.delete(message.id);
        if (message.error) item.reject(new Error(message.error.message));
        else item.resolve(message.result);
      }
    });
    function send(method, params = {}) {
      return new Promise((resolveMessage, reject) => {
        const key = ++id;
        const timeout = setTimeout(() => {
          pending.delete(key);
          reject(new Error(`DevTools timed out: ${method}`));
        }, 30000);
        pending.set(key, { resolve: resolveMessage, reject, timeout });
        socket.send(JSON.stringify({ id: key, method, params }));
      });
    }
    async function evaluate(expression) {
      const result = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails)
        throw new Error(
          result.exceptionDetails.exception?.description ||
            result.exceptionDetails.text,
        );
      return result.result.value;
    }
    async function waitFor(expression) {
      for (let attempt = 0; attempt < (development ? 450 : 100); attempt++) {
        if (await evaluate(expression)) return;
        await new Promise((done) => setTimeout(done, 200));
      }
      const visible = await evaluate("document.body.innerText");
      throw new Error(`Browser condition timed out: ${expression}\n${visible}`);
    }
    async function navigate(path) {
      await send("Page.navigate", { url: `${origin}${path}` });
      await waitFor("document.readyState === 'complete'");
      await waitFor("!document.querySelector('[class*=\"z-[9999]\"]')");
    }
    const screenshots = resolve(".next/blog-browser-check");
    mkdirSync(screenshots, { recursive: true });
    async function screenshot(name) {
      const { data } = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      writeFileSync(join(screenshots, name), Buffer.from(data, "base64"));
    }
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await navigate("/blog");
    await waitFor(
      "document.body.innerText.includes('A guide to Olympiad preparation')",
    );
    assert.equal(await evaluate("document.querySelector('main h1')?.textContent.trim()"), "Explore the journal");
    assert.equal(await evaluate("!!document.querySelector('section[aria-label=\"Featured article\"]')"), false);
    await new Promise((done) => setTimeout(done, 4000));
    assert.equal(
      await evaluate(
        "document.documentElement.scrollWidth <= window.innerWidth",
      ),
      true,
      "Desktop layout overflows.",
    );
    await screenshot("blog-desktop.png");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await navigate("/blog/olympiad-preparation");
    await waitFor("document.body.innerText.includes('Start with curiosity')");
    await new Promise((done) => setTimeout(done, 4000));
    assert.equal(
      await evaluate(
        "document.documentElement.scrollWidth <= window.innerWidth",
      ),
      true,
      "Mobile article overflows.",
    );
    await screenshot("article-mobile.png");
    const [cookieName, cookieValue] = cookie.split("=");
    await send("Network.setCookie", {
      name: cookieName,
      value: cookieValue,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    });
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await navigate("/admin/blog/new");
    await waitFor("!!document.querySelector('[contenteditable=true]')");
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Save draft')).click()",
    );
    await waitFor(
      "document.querySelector('input[aria-invalid=true]') !== null",
    );
    assert.ok(
      await evaluate(
        "document.body.innerText.includes('Add an article title.')",
      ),
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('+ New category')).click()",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('label')).find(label => label.textContent.startsWith('New category name')).querySelector('input').focus()",
    );
    await send("Input.insertText", { text: "Browser-created category" });
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Add category').click()",
    );
    await waitFor(
      "Array.from(document.querySelectorAll('select option')).some(option => option.selected && option.textContent === 'Browser-created category')",
    );
    const categoryId = await evaluate(
      "Number(document.querySelector('select').value)",
    );
    await evaluate(
      "document.querySelector('input[maxlength=\"180\"]').focus()",
    );
    await send("Input.insertText", { text: "Browser-tested rich article" });
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Save draft')).click()",
    );
    await waitFor(
      "location.pathname.endsWith('/edit') && document.body.innerText.includes('Draft saved. It is private')",
    );
    const partialId = await evaluate("Number(location.pathname.split('/')[3])");
    const partial = await evaluate(
      `fetch('/api/admin/blog/${partialId}').then(response => response.json())`,
    );
    assert.equal(partial.status, "draft");
    assert.equal(partial.excerpt, "");
    assert.equal(partial.imageId, null);
    await navigate(`/admin/blog/${partialId}/edit`);
    await waitFor("!!document.querySelector('[contenteditable=true]')");
    assert.equal(
      await evaluate(
        "document.querySelector('input[maxlength=\"180\"]').value",
      ),
      "Browser-tested rich article",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Review & publish')).click()",
    );
    assert.ok(
      await evaluate(
        "Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Publish article').disabled",
      ),
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Keep editing').click()",
    );
    await evaluate(
      "document.querySelector('textarea[maxlength=\"320\"]').focus()",
    );
    await send("Input.insertText", {
      text: "An article written through the real editor.",
    });
    await evaluate("document.querySelector('[contenteditable=true]').focus()");
    await send("Input.insertText", {
      text: "A curious mind asks thoughtful questions.",
    });
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Link').click()");
    await evaluate("document.querySelector('[aria-label=\"Edit article link\"] input[maxlength=\"2000\"]').focus()");
    await send("Input.insertText", { text: "Read the Olympiad guide" });
    await evaluate("document.querySelector('[aria-label=\"Edit article link\"] input[type=url]').focus()");
    await send("Input.insertText", { text: "https://example.com/olympiad-guide" });
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Add link').click()");
    await waitFor("document.querySelector('[contenteditable=true] a')?.getAttribute('href') === 'https://example.com/olympiad-guide'");
    await evaluate(`(() => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('[contenteditable=true] a'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    })()`);
    await new Promise((done) => setTimeout(done, 200));
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Link').click()");
    assert.equal(await evaluate("document.querySelector('[aria-label=\"Edit article link\"] input[type=url]').value"), "https://example.com/olympiad-guide");
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Add link').click()");
    await waitFor("!!document.querySelector('[contenteditable=true] a[href=\"https://example.com/olympiad-guide\"]')");
    await evaluate(`(() => {
      const data = new DataTransfer();
      data.setData('text/html', '<p>More ideas: <a href="https://example.com/pasted-guide" title="Pasted guide">Pasted guide</a></p>');
      data.setData('text/plain', 'More ideas: Pasted guide');
      document.querySelector('[contenteditable=true]').dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    })()`);
    await waitFor("!!document.querySelector('[contenteditable=true] a[href=\"https://example.com/pasted-guide\"]')");
    assert.ok(
      await evaluate("document.body.innerText.includes('Unsaved changes')"),
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'Preview').click()",
    );
    await waitFor("!!document.querySelector('article .blog-prose')");
    assert.ok(
      await evaluate(
        "document.querySelector('article .blog-prose').innerText.includes('A curious mind')",
      ),
      "Preview lost editor content.",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Return to editor')).click()",
    );
    assert.ok(
      await evaluate(
        "document.querySelector('[contenteditable=true]').innerText.includes('A curious mind')",
      ),
      "Returning from preview lost content.",
    );
    const imagePath = join(directory, "browser-featured.png");
    await sharp({
      create: { width: 800, height: 500, channels: 3, background: "#C9A227" },
    })
      .png()
      .toFile(imagePath);
    const { root } = await send("DOM.getDocument");
    const { nodeIds } = await send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: 'input[type="file"]',
    });
    assert.equal(nodeIds.length, 2);
    await send("DOM.setFileInputFiles", { nodeId: nodeIds[0], files: [imagePath] });
    await waitFor("!!document.querySelector('[contenteditable=true] img')");
    await waitFor("document.querySelector('[contenteditable=true] img').complete && document.querySelector('[contenteditable=true] img').naturalWidth > 0");
    const imagePoint = await evaluate("(() => { const img = document.querySelector('[contenteditable=true] img'); img.scrollIntoView({block:'center'}); const rect = img.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; })()");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...imagePoint, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...imagePoint, button: "left", clickCount: 1 });
    await waitFor("!!document.querySelector('[aria-label=\"Image options\"]')");
    await evaluate("document.querySelector('[aria-label=\"Inline image description\"]').focus()");
    await send("Input.insertText", { text: "An inline study illustration" });
    await evaluate("Array.from(document.querySelectorAll('[aria-label=\"Image options\"] button')).find(button => button.textContent === 'left').click()");
    await waitFor("document.querySelector('[contenteditable=true] img').getAttribute('data-display-width') === '50'");
    const handlePoint = await evaluate("(async () => { const handle = document.querySelector('[aria-label=\"Resize article image\"]'); handle.scrollIntoView({block:'center', behavior:'instant'}); await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))); const rect = handle.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, distance: document.querySelector('[contenteditable=true]').getBoundingClientRect().width * 0.1 }; })()");
    assert.equal(await evaluate(`document.elementFromPoint(${handlePoint.x}, ${handlePoint.y})?.getAttribute('aria-label')`), "Resize article image", `The resize handle is obscured: ${JSON.stringify(handlePoint)}`);
    await evaluate("(() => { window.__resizeEvents = []; for (const type of ['pointerdown', 'pointermove', 'pointerup', 'lostpointercapture']) document.addEventListener(type, event => window.__resizeEvents.push({type, x:event.clientX, target:event.target.getAttribute('aria-label')}), {capture:true}); })()");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: handlePoint.x, y: handlePoint.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: handlePoint.x - handlePoint.distance, y: handlePoint.y, buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: handlePoint.x - handlePoint.distance, y: handlePoint.y, button: "left", clickCount: 1 });
    await new Promise((done) => setTimeout(done, 200));
    assert.equal(await evaluate("document.querySelector('[contenteditable=true] img').getAttribute('data-display-width')"), "40", JSON.stringify(await evaluate("window.__resizeEvents")));
    await evaluate("document.querySelector('[aria-label=\"Inline image caption\"]').focus()");
    await send("Input.insertText", { text: "Students exploring ideas" });
    await evaluate("document.querySelector('[contenteditable=true]').focus()");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
    await send("Input.insertText", { text: "A good article brings an image and its surrounding story together. Students can explore ideas, prepare with care, and learn from each other. ".repeat(5) });
    assert.ok(await evaluate("!!document.querySelector('[contenteditable=true] img[data-display-width=\"40\"]')"), "Typing after the image replaced it.");
    async function dragImageToParagraph(index) {
      interceptedDrag = null;
      await evaluate("(() => { window.__dragEvents = []; for (const type of ['mousedown','mousemove','dragstart','dragend','dragenter','dragover','drop']) document.addEventListener(type, event => { const record = {type, target:event.target.tagName, text:event.target.textContent.slice(0,30), editor:event.target.closest('[contenteditable]')?.getAttribute('contenteditable'), prevented:event.defaultPrevented, buttons:event.buttons}; window.__dragEvents.push(record); queueMicrotask(() => record.prevented = event.defaultPrevented); }, {capture:true}); })()");
      await send("Input.setInterceptDrags", { enabled: true });
      const points = await evaluate(`(async () => {
        const paragraphs = document.querySelectorAll('[contenteditable=true] > p');
        const target = paragraphs[${index}];
        document.querySelector('[contenteditable=true] img').scrollIntoView({block:'center', behavior:'instant'});
        await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
        const image = document.querySelector('[contenteditable=true] img').getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        return { source: {x: image.x + image.width / 2, y: image.y + image.height / 2}, target: {x: rect.x + 2, y: rect.y + 2} };
      })()`);
      assert.equal(await evaluate(`document.elementFromPoint(${points.source.x}, ${points.source.y})?.tagName`), "IMG", "The draggable image is obscured.");
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...points.source });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", ...points.source, button: "left", clickCount: 1 });
      await new Promise((done) => setTimeout(done, 100));
      for (const offset of [5, 15, 30, 45]) {
        await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: points.source.x + offset, y: points.source.y + offset, button: "left", buttons: 1 });
        await new Promise((done) => setTimeout(done, 50));
        if (interceptedDrag) break;
      }
      for (let attempt = 0; attempt < 30 && !interceptedDrag; attempt++) await new Promise((done) => setTimeout(done, 100));
      assert.ok(interceptedDrag, JSON.stringify(await evaluate("({events:window.__dragEvents, image: {draggable:document.querySelector('[contenteditable=true] img').draggable, loaded:document.querySelector('[contenteditable=true] img').naturalWidth}})")));
      for (const type of ["dragEnter", "dragOver", "drop"]) {
        points.target = await evaluate(`(async () => {
          const target = document.querySelectorAll('[contenteditable=true] > p')[${index}];
          target.scrollIntoView({block:'center', behavior:'instant'});
          await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
          const text = document.createTreeWalker(target, NodeFilter.SHOW_TEXT).nextNode();
          const range = document.createRange();
          range.setStart(text, 0); range.setEnd(text, 1);
          const rect = range.getBoundingClientRect();
          return {x:rect.x + 1, y:rect.y + rect.height / 2};
        })()`);
        assert.ok(await evaluate(`document.elementFromPoint(${points.target.x}, ${points.target.y})?.closest('p') === document.querySelectorAll('[contenteditable=true] > p')[${index}]`), "The drop paragraph is obscured.");
        await send("Input.dispatchDragEvent", { type, ...points.target, data: interceptedDrag });
      }
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...points.target, button: "left", clickCount: 1 });
      await send("Input.setInterceptDrags", { enabled: false });
      await new Promise((done) => setTimeout(done, 200));
    }
    await dragImageToParagraph(0);
    assert.ok(await evaluate("!!(document.querySelector('[contenteditable=true] .node-image').compareDocumentPosition(Array.from(document.querySelectorAll('[contenteditable=true] > p')).find(p => p.textContent.includes('A curious mind'))) & Node.DOCUMENT_POSITION_FOLLOWING)"), JSON.stringify(await evaluate("({events:window.__dragEvents, nodes:Array.from(document.querySelector('[contenteditable=true]').children).map(node => ({type:node.tagName, text:node.textContent.slice(0,45), image:!!node.querySelector('img')}))})")));
    const storyIndex = await evaluate("Array.from(document.querySelectorAll('[contenteditable=true] > p')).findIndex(p => p.textContent.includes('A good article'))");
    await dragImageToParagraph(storyIndex);
    await evaluate(`(() => {
      const image = document.querySelector('[contenteditable=true] .node-image');
      const range = document.createRange();
      range.selectNode(image);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    })()`);
    await new Promise((done) => setTimeout(done, 200));
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Quote').click()");
    await waitFor("!!document.querySelector('[contenteditable=true] blockquote .node-image')");
    await send("DOM.setFileInputFiles", {
      nodeId: nodeIds.at(-1),
      files: [imagePath],
    });
    await waitFor(
      "!!document.querySelector('img[alt=\"Featured image preview\"]')",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('label')).find(label => label.textContent.startsWith('Image description (alt text)')).querySelector('input').focus()",
    );
    await send("Input.insertText", { text: "A golden illustration" });
    await waitFor(
      "document.querySelector('img[alt=\"A golden illustration\"]').complete && document.querySelector('img[alt=\"A golden illustration\"]').naturalWidth > 0",
    );
    await new Promise((done) => setTimeout(done, 500));
    await evaluate(
      "document.querySelector('img[alt=\"A golden illustration\"]').dispatchEvent(new Event('error'))",
    );
    await waitFor(
      "document.body.innerText.includes('Image preview could not load')",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Retry image').click()",
    );
    await waitFor(
      "document.querySelector('img[alt=\"A golden illustration\"]').naturalWidth > 0",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Save draft')).click()",
    );
    await waitFor(
      "location.pathname.startsWith('/admin/blog/') && location.pathname.endsWith('/edit')",
    );
    const createdId = await evaluate("Number(location.pathname.split('/')[3])");
    assert.equal(
      createdId,
      partialId,
      "Saving again created a duplicate draft.",
    );
    await waitFor(
      "document.body.innerText.includes('Draft saved. It is private')",
    );
    assert.ok(
      await evaluate("!document.body.innerText.includes('Unsaved changes')"),
    );
    const savedLink = await evaluate(`(async () => { const post = await (await fetch('/api/admin/blog/${createdId}')).json(); return JSON.stringify(post.content); })()`);
    assert.ok(savedLink.includes("https://example.com/olympiad-guide"), "Draft save lost the editor link.");
    assert.ok(savedLink.includes("https://example.com/pasted-guide"), "Draft save lost a pasted link.");
    assert.ok(savedLink.includes('"displayWidth":40') && savedLink.includes('"align":"left"'), "Draft save lost image layout.");
    assert.ok(savedLink.includes('"type":"blockquote"'), "Draft save lost the image's quote container.");
    await evaluate("window.scrollTo(0, 0)");
    await screenshot("admin-editor-desktop.png");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert.ok(
      await evaluate(
        "document.documentElement.scrollWidth <= window.innerWidth",
      ),
      "Mobile editor overflows.",
    );
    await screenshot("admin-editor-mobile.png");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Review & publish')).click()",
    );
    await waitFor(
      "Array.from(document.querySelectorAll('button')).some(button => button.textContent.includes('Publish article') && !button.disabled)",
    );
    await evaluate(
      "Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Publish article')).click()",
    );
    await waitFor(
      "document.body.innerText.includes('Article published.') || document.body.innerText.includes('Published ·')",
    );
    assert.ok(
      await evaluate("!document.body.innerText.includes('Unsaved changes')"),
      "Saving/publishing falsely marks the document dirty.",
    );
    await navigate("/blog/browser-tested-rich-article");
    await waitFor(
      "document.body.innerText.includes('A curious mind asks thoughtful questions.')",
    );
    assert.equal(await evaluate("document.querySelector('article .blog-prose a')?.getAttribute('href')"), "https://example.com/olympiad-guide");
    assert.ok(await evaluate("!!document.querySelector('article .blog-prose a[href=\"https://example.com/pasted-guide\"]')"));
    assert.equal(await evaluate("document.querySelector('article .blog-inline-image').style.width"), "40%");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('article .blog-inline-image')).float"), "left");
    assert.ok(await evaluate("document.querySelector('article blockquote .blog-inline-image')?.closest('blockquote').nextElementSibling?.textContent.includes('A good article')"), "The quoted image did not stay before the following text.");
    assert.equal(await evaluate("document.querySelector('article figcaption').textContent"), "Students exploring ideas");
    await waitFor("!document.querySelector('[class*=\"z-[9999]\"]')");
    await waitFor("document.querySelector('article .blog-inline-image img').complete && document.querySelector('article .blog-inline-image img').naturalWidth > 0");
    assert.equal(await evaluate("!!document.querySelector('article > div.relative')"), false, "The article still shows a cover image.");
    await evaluate("document.querySelector('article .blog-inline-image').scrollIntoView({block:'center'})");
    await screenshot("article-inline-desktop.png");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate("getComputedStyle(document.querySelector('article .blog-inline-image')).float"), "none");
    assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Mobile images overflow.");
    await evaluate("document.querySelector('article .blog-inline-image').scrollIntoView({block:'center'})");
    await screenshot("article-inline-mobile.png");
    assert.equal(errors.length, 0, `Browser exceptions: ${errors.join("\n")}`);
    const deleted = await evaluate(
      `(async () => { const post = await (await fetch('/api/admin/blog/${createdId}')).json(); const response = await fetch('/api/admin/blog/${createdId}', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: post.version }) }); return response.status; })()`,
    );
    assert.equal(
      deleted,
      200,
      "Could not remove the disposable browser article.",
    );
    const categoryDeleted = await evaluate(
      `fetch('/api/admin/blog/categories/${categoryId}', { method: 'DELETE' }).then(response => response.status)`,
    );
    assert.equal(categoryDeleted, 200);
    console.log(
      "Browser checks passed: responsive layouts, real rich-text editing, unsaved preview, featured upload, draft save and publication. Screenshots: .next/blog-browser-check/",
    );
    await send("Browser.close").catch(() => {});
  } finally {
    socket?.close();
    if (browser.exitCode === null) {
      const exited = once(browser, "exit");
      browser.kill();
      await exited;
    }
  }
}
