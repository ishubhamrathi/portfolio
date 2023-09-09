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
            tech={["ReactJs"]} github_link=""
            deployed_link=""
          />

          <Project title="Ums Web App" description="Lipsum Lorem"
            img="https://images.unsplash.com/photo-1579353977828-2a4eab540b9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80"
            tech={["ReactJs", "NodeJs"]} github_link=""
            deployed_link=""
          />

          <Project title="Ums Web App" description="Lipsum Lorem"
            img="https://images.unsplash.com/photo-1579353977828-2a4eab540b9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80"
            tech={["ReactJs","sdsdsd","sdsdsd","sdsdsd","sdsdsd","sdsdsd","sdsdsd","sdsdsd"]} github_link=""
            deployed_link=""
          />
      </div>
    </div>
  )
}

export default Projects