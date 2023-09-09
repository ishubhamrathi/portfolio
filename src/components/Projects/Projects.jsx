import React, { useState } from 'react'
import styles from './projects.module.css'
import Project from '../Project/Project'
const Projects = () => {
  const [show, setShow] = useState(false);
  const showModal=()=>{
    setShow(true);
  }
  return (
    <div className={styles.container}>
      <div className={styles.title} id="projects">Projects</div>
      <div className={styles.list}>
          {/* <button onClick={e=>{showModal()}}> */}
            <Project 
            title="Music App"
            description="Lipsum Lorem"
            img="https://i.ibb.co/mJ45n93/project1.png"
            tech={["ReactJs"]}
            github_link="https://github.com/ishubhamrathi/portfolio"
            deployed_link="https://musicapp009.netlify.app"
            show={show}
          />
          {/* </button> */}
          {/* <button onClick={e=>{showModal()}}> */}
          <Project
            title="LPU UMS"
            description="Lipsum Lorem"
            img="https://i.ibb.co/K5gYJKh/project2.png"
            tech={["Python", "Streamlit"]}
            github_link="https://github.com/ishubhamrathi/UMS"
            deployed_link="https://lpuums.streamlit.app"
            show={show}
          />
          {/* </button> */}
          <Project
            title="Resume Builder"
            description="Lipsum Lorem"
            img="https://i.ibb.co/0DX6Vt9/project3.png"
            tech={["ReactJs","Nodejs"]}
            github_link="https://github.com/ishubhamrathi/resume-builder"
            deployed_link="https://resumebuilder.netlify.app"
          />
          <Project 
            title="Hotel Reservation"
            description="This app is used for something called"
            img="https://i.ibb.co/54jHw7L/Screenshot-2023-09-09-165756.png"
            tech={["ReactJs", "Nodejs"]}
            github_link=""
            deployed_link=""
          />
          <Project
            title="Spritual Mantra"
            img="https://i.ibb.co/qytFtz8/spritual-mantra.png"
            tech={["ReactJs"]}
            github_link="https://github.com/ishubhamrathi/spritual-mantra"
            deployed_link="https://spritualmantra.netlify.app"
          />
          <Project
            title="Todo App"
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