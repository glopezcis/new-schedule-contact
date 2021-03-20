import { repeat } from 'lodash';
import React, { useState, forwardRef, useEffect, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSortDown} from '@fortawesome/free-solid-svg-icons';
const eyeSlash = <FontAwesomeIcon icon={faSortDown} />;

export default LanguageSelector = forwardRef((props, ref) => {
    const [langChosen, setLangChosen] = useState("en");

    const changeLanguage = (lang) => {
        setLangChosen(lang);
        props.languageChange(lang);
    }

    const languageInformation = {
        "es": {text: "Español", flag: "https://www.countryflags.io/es/shiny/32.png"}, 
        "en": {text: "English", flag: "https://www.countryflags.io/us/shiny/32.png"}
    }

    return (
        <div className="menu_countries">
            <div className="lang-menu">
                <div className="selected-lang" style= {{backgroundImage: `url(${languageInformation[langChosen].flag})`, backgroundRepeat:"no-repeat", verticalAlign: "center"}}>
                    {languageInformation[langChosen].text}  <i style={{marginTop : "-2px"}}>{eyeSlash}</i>
                </div>
                <ul>
                    <li>
                        <a onClick={() => changeLanguage("es")} className="es" style= {{backgroundImage: `url(${languageInformation["es"].flag})`, backgroundRepeat:"no-repeat"}}>
                            {languageInformation["es"].text}</a>
                    </li>
                    <li>
                        <a onClick={() => changeLanguage("en")} className="en" style= {{backgroundImage: `url(${languageInformation["en"].flag})`, backgroundRepeat:"no-repeat"}}>
                            {languageInformation["en"].text}</a>
                    </li>
                </ul>
                
            </div>
        </div>
    )
})