import React from 'react'
import styles from './projects.module.css'
import Project from '../Project/Project'
const Projects = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title} id="projects">Projects</div>
      <div className={styles.list}>
            <Project 
            title="Music App"
            description="Play music from online library, option to download locally music files."
            img="https://i.ibb.co/mJ45n93/project1.png"
            tech={["ReactJs"]}
            github_link="https://github.com/ishubhamrathi/portfolio"
            deployed_link="https://musicapp009.netlify.app"
          />
          <Project
            title="LPU UMS"
            description="This website is for LPU students.They will be able to view Time Table, Messages, Announcements, Exam Result and more."
            img="https://i.ibb.co/K5gYJKh/project2.png"
            tech={["Python", "Streamlit"]}
            github_link="https://github.com/ishubhamrathi/UMS"
            deployed_link="https://lpuums.streamlit.app"
          />
          <Project
            title="Resume Builder"
            description="A simple form based app. Make your resume quickly by just filling simple form details, we will take care of formatting."
            img="https://i.ibb.co/0DX6Vt9/project3.png"
            tech={["ReactJs","Nodejs"]}
            github_link="https://github.com/ishubhamrathi/resume-builder"
            deployed_link="https://resumebuilder009.netlify.app"
          />
          <Project 
            title="Hotel Reservation"
            description="Book your desired hotel for required days or nights."
            img="https://i.ibb.co/54jHw7L/Screenshot-2023-09-09-165756.png"
            tech={["ReactJs", "Nodejs"]}
            github_link=""
            deployed_link=""
          />
          <Project
            title="Spritual Mantra"
            description="Part of Hackathon (theme sprituality). Lists Yogas and Meditation - a step towards sprituality"
            img="https://i.ibb.co/qytFtz8/spritual-mantra.png"
            tech={["ReactJs"]}
            github_link="https://github.com/ishubhamrathi/spritual-mantra"
            deployed_link="https://spritualmantra.netlify.app"
          />
          <Project
            title="Todo App"
            description="Basic todo application to list down all the things you are going to do"
            img="https://i.ibb.co/X5HXBG3/Screenshot-2023-09-09-170233.png"
            tech={["ReactJS"]}
            github_link="https://github.com/ishubhamrathi/TodoApp"
            deployed_link="https://todoapp009.netlify.app/"
          />
            </div>
    </div>
  )
}

export default Projects