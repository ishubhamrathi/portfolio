import React from 'react';
import styles from './modal.module.css';
import {AiFillCloseCircle} from 'react-icons/ai'
const Modal = (props) => {
    const { show, description, github_link, deployed_link, info } = props;

    return (
        <div className={show ? styles.modalContainer : styles.hidden}>
            {show && (
                <div className={styles.modalContent}>
                    <AiFillCloseCircle/>
                    <h2>{description}</h2>
                    <p>{info}</p>
                    <a href={github_link}>GitHub Link</a>
                    <a href={deployed_link}>Deployed Link</a>
                </div>
            )}
        </div>
    );
};

export default Modal;
