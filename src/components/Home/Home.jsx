import React from 'react'
import styles from './home.module.css'
import {AiFillPlayCircle, AiFillHome} from 'react-icons/ai'
import {GoProjectSymlink} from'react-icons/go'
import {BsFillInfoCircleFill} from "react-icons/bs"
import {IoShareSocialOutline} from "react-icons/io5"

const Home =()=>{
    return (
        <React.Fragment>
            <div className={styles.container}>
                <div className={styles.left}>
                    <div className={styles.warpper}>
                        <div className={styles.greeting}>Hi, I am</div>
                        <div className={styles.name}>Shubham Rathi</div>
                        <br></br><br></br>
                        <div className={styles.text}><AiFillPlayCircle/><input type="text" placeholder='Tell me what you need!'/></div>
                    </div>
                </div>
                <div className={styles.right}>
                    <nav className={styles.navbar}>
                        <li className={styles.navlink}><a href="/"><AiFillHome/>&nbsp;<span className={styles.link}>Home</span></a></li>
                        <li className={styles.navlink}><a href="#projects"><GoProjectSymlink/>&nbsp;<span className={styles.link}>Projects</span></a></li>
                        <li className={styles.navlink}><a href="#about"><BsFillInfoCircleFill/>&nbsp;<span className={styles.link}>About</span></a></li>
                        <li className={styles.navlink}><a href="#social"><IoShareSocialOutline/>&nbsp;<span className={styles.link}>Contact</span></a></li>
                    </nav>
                </div>
            </div>
        </React.Fragment>
    )
}
export default Home;