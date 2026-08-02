import React from 'react'
import { AboutTimeline }  from '@/components/AboutTimeline'
import { Navbar } from '@/components/Navbar'
import { TeamSection } from '@/components/TeamSection'

const About = () => {
  return (
    <div>
        <TeamSection/>
        <Navbar/>
      <AboutTimeline />

    </div>
  )
}

export default About
