import React, { useState, useEffect } from 'react'
import styles from './Project.module.css'
import {AiFillGithub, AiOutlineCode, AiFillInfoCircle} from 'react-icons/ai'
import {BiLinkAlt} from 'react-icons/bi'

const Project = (props) => {
  const {title, description, img, github_link, deployed_link, tech}=props;
  const [isActive, setIsActive]=useState(false);
  const handleClick=()=>{
    setIsActive(current=>!current);
  }
  useEffect(() => {
    const savedIsActive = localStorage.getItem('isActive');
    if (savedIsActive !== null) {
      setIsActive(savedIsActive === 'true');
    }
  }, []);
return (
    <div className={styles.container} onClick={handleClick}>
      <div className={styles.bgimg}><img src={img} alt=""/></div>
      <div className={styles.title}>{title}</div> 
      <div className={styles.links}>
        <div className={styles.github}><a href={github_link}><AiFillGithub/>&nbsp;Github</a></div>
        <div className={styles.deploy}><a href={deployed_link}><BiLinkAlt/>&nbsp;View</a></div>
      </div>
      <div className={isActive ? `${styles.info}` :`${styles.hidden}`}>
        <div className={styles.desc}>
         <AiFillInfoCircle/>&nbsp;Description:&nbsp;{description}
        </div>
        <div className={styles.tech}>
         <AiOutlineCode/>:&nbsp;{tech.map((item)=> {return <span>{item}&nbsp;</span>})}
        </div>
      </div>
      
      
    </div>
  )
}

export default Project