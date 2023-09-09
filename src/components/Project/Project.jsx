import React from 'react'
import styles from './Project.module.css'
import {AiFillGithub, AiOutlineCode} from 'react-icons/ai'
import {BiLinkAlt} from 'react-icons/bi'

const Project = (props) => {
  const {title, img, githublink, deployedlink, tech}=props;
  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div> 
      <div className={styles.bgimg}><img src={img} alt=""/></div>
      <div className={styles.links}> 
        <div className={styles.github}><a href={githublink}><AiFillGithub/>&nbsp;Github</a></div>
        
        <div className={styles.deploy}><a href={deployedlink}><BiLinkAlt/>&nbsp;View</a></div>
      </div>
      <div className={styles.tech}> <AiOutlineCode/>:&nbsp;{tech.map((item)=> {return <span>{item}&nbsp;</span>})}
      </div>

    </div>
  )
}

export default Project