primes = [2]
primes2 = [2]
count = 0
i=3
for i in range(3,99381):
    is_prime = True

    for j in range(2,i):
        if i % j == 0:
            is_prime = False
    if is_prime == True:
        primes.append(i)
        if i<2146:
            primes2.append(i)


for prime in primes:
    for prime2 in primes2:
        N = prime * prime + prime2 * prime2 * prime2
        digits = []
        while N>0:
            digits.append(N%10)
            N = N // 10
        digits.sort()
        if digits == [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]:
            count = count + 1

print(count)
