import React from 'react'
import styles from './social.module.css'
import {AiFillGithub,AiFillLinkedin,AiFillInstagram,AiFillMail } from 'react-icons/ai'
const Social = () => {
  return (
    <div className={styles.container}>
    <div className={styles.title} id="social">Follow Me</div>
    <div className={styles.wrapper}>
        <div className={styles.list}>
            <div className={styles.items}><a href="https://github.com/ishubhamrathi"><AiFillGithub/></a></div>
            <div className={styles.items}><a href="https://linkedin.com/in/ishubhamrathi"><AiFillLinkedin/></a></div>
            <div className={styles.items}><a href="https://instagram.com/ishubhamrathi"><AiFillInstagram/></a></div>
            <div className={styles.items}><a href="mailto:shubh2q2q@gmail.com"><AiFillMail/></a></div>
        </div>
    </div>
  </div>
  )
}

export default Social