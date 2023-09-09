import React from 'react'
import styles from './projects.module.css'
import Project from '../Project/Project'
const Projects = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>Projects</div>
      <div className={styles.list}>
          <Project title="Music App" description="Lipsum Lorem"
            img="https://i.ibb.co/mJ45n93/project1.png"
            tech={["ReactJs"]} github_link="https://github.com/ishubhamrathi/portfolio"
            deployed_link="https://musicapp009.netlify.app"
          />

          <Project title="LPU UMS" description="Lipsum Lorem"
            img="https://i.ibb.co/K5gYJKh/project2.png"
            tech={["Python", "Streamlit"]} github_link="https://github.com/ishubhamrathi/UMS"
            deployed_link="https://lpuums.streamlit.app"
          />

          <Project title="Resume Builder" description="Lipsum Lorem"
            img="https://i.ibb.co/0DX6Vt9/project3.png"
            tech={["ReactJs","Nodejs"]} github_link="https://github.com/ishubhamrathi/resume-builder"
            deployed_link="https://resumebuilder.netlify.app"
          />
      </div>
    </div>
  )
}

export default Projects