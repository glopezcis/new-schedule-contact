import React, { useState, forwardRef, useEffect, useImperativeHandle } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { Form as Formio } from 'react-formio';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { uploadFileToS3 } from '/imports/startup/client/utils';
import {IntlProvider, FormattedMessage} from 'react-intl';

import InputMask from "react-input-mask";
import NumberFormat from 'react-number-format';
import moment from 'moment';

const axios = require('axios');
const caledarioIcon = <FontAwesomeIcon icon={faCalendarAlt} />;

import { requiredColor, noRequiredColor } from '../../constants/constants';
import { EXECUTEDACTION } from '/imports/constants/constants';
import messages from '../../constants/translation.json';
import STATES from '/imports/ui/pages/utils/constants.js';
import LanguageSelector from "../components/LanguageSelector";
import Loading from '../components/Loading/Loading';
import CustomDatePicker from '../components/CustomDatePicker';

export default NewScheduleContact = forwardRef((props, ref) => {
	const { 
		index,
		deleteItem,
		itemId,
		showTitle = true,
		isInRegister,
		readOnly = false,
		hideInsuranceData = false,
		readOnlyPersonalData = false,
		showCustomSurvey = false,
		customSurvey = null,
		selfRegistrationWithContact,
		eventLinkedQueueInWaitlist,
		languageChangeProps,
		useAgencyData,
		useAllCarriers,
		useQueueById
	} = props;
	
	let initDateOfContact = null;
	let initDob = null;
	let initDobInput = null;
	const onlyLettersRegex = /^[a-zA-Z]*$/g
	const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g

	const { agencyData } = useAgencyData();
	const [ initialValues, setInitialValues ] = useState({});
	const [ urlCard, setUrlCard ] = useState(null);
	const [ loadingCard, setLoadingCard ] = useState(false);
	const [ showInsurance, setshowInsurance ] = useState(!hideInsuranceData);
	const { register, getValues, reset } = useForm();
	const [ contactDateInput, setContactDateInput ] = useState(moment().format('MM/DD/YYYY'));
	const [ contactDate, setContactDate ] = useState(new Date());
	const [ dob, setDob ] = useState(initDob);
	const [ dobInput, setDobInput ] = useState(initDobInput);
	const [ policyHolderDob, setPolicyHolderDob ] = useState(null);
	const [ policyHolderDobInput, setPolicyHolderDobInput ] = useState(null);
	const [ phone, setPhone ] = useState('');
	const [ type, setType ] = useState('');
	const [ missingData, setMissingData ] = useState({});
	const [ isHomeless, setHomeless ] = useState('no');
	const [invalidZipcode, setInvalidZipcode] = useState(false);
	const [oojZipCode, setOojZipCode] = useState(false);
	const [nameValue, setNameValue] = useState('');
	const [lastNameValue, setLastNameValue] = useState('');
	const [emailValue, setEmailValue] = useState(null);
	const [emailFormatError, setEmailFormatError] = useState(false)
	const [ carrier, setCarrier ] = useState('');
	const { allCarriers } = useAllCarriers();
	const [zipcodeToSearch, setZipcodeToSearch] = useState(null);
	const [zipcodeSearching, setZipcodeSearching] = useState(null);
	const [zipcodes, setZipcodes] = useState(null);
	const { loading: loadingQueue, queue } = useQueueById(eventLinkedQueueInWaitlist);
	const [ landline, setLandline ] = useState(false);
	const [ landphone, setLandphone ] = useState('');
	const [ requiredItems, setRequiredItems ] = useState([]);
	const [locale, setLocale] = useState("en");
	const [messageType, setMessageType] = useState('TWILIO');

	useEffect(() => {
		if (!agencyData) return;
		const { general } = agencyData;
		setZipcodes(general.zipCodes || []);
		const requiredItems = general.requiredInputs ? general.requiredInputs: [];
		setRequiredItems(requiredItems);
	}, [agencyData]);

	useEffect(() => {
		Meteor.call("getSMSType", (error, result) => {
			setMessageType(result);
		})		
	}, []);

	useEffect(() => {
		if (props.contact) {
			console.log(props.contact);
			const newInitialValues = {};
			newInitialValues.other = props.contact.other;
			newInitialValues.name = props.contact.name;
			setNameValue(props.contact.name);
			newInitialValues.lastName = props.contact.lastName;
			setLastNameValue(props.contact.lastName);
			newInitialValues.email = props.contact.email;
			setEmailValue(props.contact.email);
			newInitialValues.address = props.contact.address;
			setZipcodeSearching(newInitialValues.zip)
			newInitialValues.address2 = props.contact.address2;
			newInitialValues.state = props.contact.state;
			newInitialValues.city = props.contact.city;
			newInitialValues.zip = props.contact.zip;
			setZipcodeSearching(props.contact.zip)
			newInitialValues.middlename = props.contact.middlename;
			newInitialValues.gender = props.contact.gender;

			newInitialValues.note = props.contact.note;
			newInitialValues.status = props.contact.status;
			newInitialValues.type = props.contact.type;
			newInitialValues.extraTypeData = props.contact.extraTypeData;
			newInitialValues.homeless = props.contact.homeless;

			// Race & ethnicity
			newInitialValues.race = props.contact.race;
			newInitialValues.ethnicity = props.contact.ethnicity;

			//Insurance
			newInitialValues.noInsurance = props.contact.noInsurance || false;
			newInitialValues.holderName = props.contact.holderName;
			newInitialValues.insuranceType = props.contact.insuranceType;
			newInitialValues.policyNumber = props.contact.policyNumber;
			newInitialValues.groupNumber = props.contact.groupNumber;
			newInitialValues.primaryInsurance = props.contact.primaryInsurance;
			newInitialValues.insuranceName = props.contact.insuranceName;
			newInitialValues.carrier = props.contact.carrier;
			newInitialValues._id = props.contact._id;

			const doc = props.contact.dateOfContact || null;
			const docInput = moment(props.contact.dateOfContact).format('MM/DD/YYYY') || null;
			const dob = props.contact.dob || null;
			const dobInput = moment(props.contact.dob).format('MM/DD/YYYY') || null;
			const phDob = props.contact.policyHolderDob || null;
			const phDobInput = moment(props.contact.policyHolderDob).format('MM/DD/YYYY') || null;

			if (props.contact.urlCard) {
				setUrlCard(props.contact.urlCard);
			}

			setType(props.contact.type);
			setPhone(props.contact.phone || '');
			setLandphone(props.contact.landphone || '');
			setCarrier(props.contact.carrier || '');
			setPolicyHolderDob(phDob);
			setPolicyHolderDobInput(phDobInput)
			setDob(dob);
			setDobInput(dobInput);
			setContactDate(doc);
			setContactDateInput(docInput)
			setInitialValues(newInitialValues);
			reset(newInitialValues);
			setHomeless(newInitialValues.homeless || 'no');
			setLandline(props.contact.landline || false);
		}

		const fetchData = async () => {
			const response = await axios
			.get('https://api.mapbox.com/geocoding/v5/mapbox.places/'+encodeURIComponent(zipcodeSearching)+'.json?types=postcode&country=US&access_token=pk.eyJ1IjoiaW5ub3ZhdGVkc29mdCIsImEiOiJja2tvMXRyMnoxcjZ2MnZtem9rN2Qyd3k4In0._jWajVWVHiEETHF6Bp9s6A&limit=1');
			zipcodeSelected(response.data.features)
		};

		if (zipcodeSearching) {
			fetchData();
		}
	}, [ props.contact, zipcodeToSearch ]);

	const copyInsuranceData = function() {
		const { beforeData } = props;
		const data =  getValues();
		data.groupNumber = beforeData.groupNumber;
		data.holderName = beforeData.holderName;
		data.policyNumber = beforeData.policyNumber;
		data.insuranceType = beforeData.insuranceType;
		reset(data);
	}

	const copyHoldername = function() {
		const data =  getValues();
		data.holderName = `${data.name} ${data.lastName}`;
		reset(data);
	}

	const copyHolderDob = function() {
		const newHolderDob = new Date(dob);
		setPolicyHolderDob(newHolderDob);
		setPolicyHolderDobInput(moment(newHolderDob).format('MM/DD/YYYY'));
	}

	const copyDataFromMain = function(keyToCopy) {
		const { getMainInfo } = props;
		const getMainInfoData = getMainInfo();
		const auxInitialValues = {...initialValues};
		if(keyToCopy == 'address') {
			auxInitialValues.address = getMainInfoData.address;
			auxInitialValues.address2 = getMainInfoData.address2;
			auxInitialValues.state = getMainInfoData.state;
			auxInitialValues.city = getMainInfoData.city;
			setInitialValues(auxInitialValues)
			setZipcodeSearching(getMainInfoData.zip)
		} else if (keyToCopy == 'insurance') {
			auxInitialValues.holderName = getMainInfoData.holderName;
			auxInitialValues.insuranceType = getMainInfoData.insuranceType;
			auxInitialValues.policyNumber = getMainInfoData.policyNumber;
			auxInitialValues.groupNumber = getMainInfoData.groupNumber;
			auxInitialValues.primaryInsurance = getMainInfoData.primaryInsurance;
			auxInitialValues.insuranceName = getMainInfoData.insuranceName;
			setPolicyHolderDob(getMainInfoData.policyHolderDob);
			setPolicyHolderDobInput(moment(getMainInfoData.policyHolderDob).format('MM/DD/YYYY'));
			setInitialValues(auxInitialValues)
		}
	}

	const uploadFile = async function(file) {
		setLoadingCard(true);
		const url = await uploadFileToS3(file);
		setLoadingCard(false);
		setUrlCard(url);
	}

	useImperativeHandle(ref, () => ({
    getData() {
			const data = getValues();
			console.log('Data => ', data);
			const needEmployerSchoolName = ['schoolTeacher', 'daycareProfessional',
				'medicalProfessional', 'essentialWorker'];
			data.contactId = initialValues._id? initialValues._id: `id${Date.now()}`;
			data.dateOfContact = contactDate;
			data.dob  = dob;
			data.policyHolderDob = policyHolderDob;
			data.urlCard = urlCard;
			data.phone = phone;
			data.carrier = carrier;
			data.landphone = landphone;
      data.landline = landline;

			const errorsObject = {
				name : data.name ? false : true,
				lastName : data.lastName ? false : true,
				type : (!needEmployerSchoolName.includes(data.type) && !data.type) ? true : false,
				extraTypeData : (needEmployerSchoolName.includes(data.type) && !data.extraTypeData) ? true : false, 
				dob : data.dob ? false : true,
				email : data.email ? false : true,
				emailFormat : emailRegex.test(data.email) ? false : true,
				phone : data.phone ? false : true,
				holderName : data.holderName ? false : true,
				policyNumber : data.policyNumber ? false : true,
				carrier : data.carrier ? false : true
			}
			setMissingData(errorsObject);
			return data;
		}
	}));

	const showCopy = index > 1;
	const needEmployerSchoolName = ['schoolTeacher', 'daycareProfessional',
				'medicalProfessional', 'essentialWorker'];
	const showExtraTypeData = needEmployerSchoolName.includes(type);

	const formatterDateInput = (dobFormattInput) => {
		let invalidDate = false
		if (dobFormattInput) {
			const reGoodDate = /(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d/i;
			if(reGoodDate.test(dobFormattInput)){
				const dateSelected = moment(dobFormattInput, "MM/DD/YYYY").toDate()
				if(dateSelected > new Date()) {
					invalidDate = true
					setDobInput('')
				} else {
					setDob(dateSelected);
					setDobInput(dobFormattInput)
				}

			} else if ((!reGoodDate.test(dobFormattInput) && !dobFormattInput.includes('_'))) {
				invalidDate = true
			}
			setDobInput(invalidDate ? '' : dobFormattInput)
		}
	}

	const formatterDateCalendar = (date)  => {
		if(date > new Date()) {
			setDobInput('')
		} else {
			setDob(date);
			setDobInput(moment(date).format('MM/DD/YYYY'));
		}
	}

	const formatterDateInputContactDate = (formattDate) => {
		let invalidDate = false
		if (formattDate) {
			const reGoodDate = /(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d/i;
			if(reGoodDate.test(formattDate)){
				const dateSelected = moment(formattDate, "MM/DD/YYYY").toDate()
				if(dateSelected > new Date()) {
					invalidDate = true
					setContactDateInput('')
				} else {
					setContactDate(dateSelected);
					setContactDateInput(formattDate)
				}

			} else if ((!reGoodDate.test(formattDate) && !formattDate.includes('_'))) {
				invalidDate = true
			}
			setContactDateInput(invalidDate ? '' : formattDate)
		}
	}

	const formatterDateCalendarContactDate = (date)  => {
		if(date > new Date()) {
			setContactDate(null);
			setContactDateInput('');
		} else {
			setContactDate(date);
			setContactDateInput(moment(date).format('MM/DD/YYYY'));
		}
	}

	const formatterDateInputPolicyHolderDob = (formattDate) => {
		let invalidDate = false
		if (formattDate) {
			const reGoodDate = /(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d/i;
			if(reGoodDate.test(formattDate)){
				const dateSelected = moment(formattDate, "MM/DD/YYYY").toDate()
				if(dateSelected > new Date()) {
					invalidDate = true
					setPolicyHolderDobInput('')
				} else {
					setPolicyHolderDob(dateSelected);
					setPolicyHolderDobInput(formattDate)
				}

			} else if ((!reGoodDate.test(formattDate) && !formattDate.includes('_'))) {
				invalidDate = true
			}
			setPolicyHolderDobInput(invalidDate ? '' : formattDate)
		}
	}

	const formatterDateCalendarPolicyHolderDob = (date)  => {
		if(date > new Date()) {
			setPolicyHolderDobInput('')
		} else {
			setPolicyHolderDob(date);
			setPolicyHolderDobInput(moment(date).format('MM/DD/YYYY'));
		}
	}

	const ButtonShowCalendar = forwardRef(({ value, onClick }) => (
		<div className="image-calendar" onClick={onClick}>
			<i>{caledarioIcon}</i>
		</div>
	));

	const zipcodeSelected = (zipcodeText) => {
		setInvalidZipcode(true);
		setOojZipCode(false);
		if (zipcodeText.length > 0 ) {
			for (elements of zipcodeText[0].context){
				if (elements.id.split('.')[0] == 'place'){
					initialValues.city = elements.text
				}
				if (elements.id.split('.')[0] == 'region' ){
					const stateFound = STATES.filter((state) => state.name == elements.text)
					if(stateFound.length > 0){
						initialValues.state = stateFound[0]._id
					}
				}
			}
			if(!zipcodes.includes(zipcodeText[0].text)){
				setOojZipCode(true)
			}
			setInvalidZipcode(false);
		}
	}

	const onChangeZipcodeSearching = newKey => {
		const postalCodeRe = /^\d{5}$|^\d{5}-\d{4}$/;
		const value = newKey.target.value.replace(/[^0-9]/g, "");

		if (postalCodeRe.test(value)) {
			setZipcodeSearching(value)
			setZipcodeToSearch(value);
		}
		else {
			initialValues.city = null;
			initialValues.state = null;
			setZipcodeSearching(value)
		}
	};

	const onChangeNameValue = event =>{
	if(onlyLettersRegex.test(event.target.value)){
			setNameValue(event.target.value);
		}
	}

	const onChangeLastNameValue = event =>{
		if(onlyLettersRegex.test(event.target.value)){
			setLastNameValue(event.target.value);
		}
	}

	const onChangeEmailValue = event =>{
		setEmailValue(event.target.value)
		setEmailFormatError(false)
		if(!emailRegex.test(event.target.value)){
			setEmailFormatError(true)
		}
	}

	const evaluateIfRequired = (name)  => {
		let result = false;
		requiredItems.forEach(element => {
			if(element.name == name){
				if(hideInsuranceData){
					result = element.waitlist.required == true;
				}else{
					result = element.queue.required == true;
				}
			}
		});
		return result;
	}

	const LanguageLabel = function(name){
    let nameRequiered = evaluateIfRequired(name);
    if (landline && name == 'phone') {
      nameRequiered = false;
    }

		return (
			<IntlProvider locale = {locale} messages = {messages[locale]}>
				<label style={ {color: nameRequiered ? requiredColor : noRequiredColor} }>
					{nameRequiered ? '*' : '' }
					<FormattedMessage id = {name}>
						{{ locale }}
					</FormattedMessage>
				</label>
		</IntlProvider>
		)
	}

	const LanguageLabelComplements = function(id){
		return (
			<IntlProvider locale = {locale} messages = {messages[locale]}>
					<FormattedMessage id = {id}>
						{{ locale }}
					</FormattedMessage>
		</IntlProvider>
		)
	}

	const LanguageLabelSelects = function(id){
		return messages[locale][id];
	}

	const languageChange = (lang) =>{
		setLocale(lang);
		languageChangeProps(lang);
	}

	if (loadingQueue){
		return <Loading />;
	}

	return (
		<form style={{
			borderStyle: 'solid',
			padding: 10,
			marginTop: 10,
			borderColor: '#00619E'
		}}>
			<LanguageSelector 
				languageChange = {languageChange}
			/>
			{showTitle && (
				<>
				{/* <div className="mt-3 text-right">
					<Col>
						<label>Select Language - </label>
						<img src= "https://www.countryflags.io/ES//64.png" height="40" width="40" onClick={() => languageChange("es")}></img>
						<img src= "https://www.countryflags.io/US/shiny/64.png" height="40" width="40" onClick={() => languageChange("en")}></img>
					</Col>
				</div> */}
				<Row className="mt-1 mb-2">
					<br></br>
					<Col md={4}><hr /> </Col>
					<Col md={3}>
						<center>
							<h4 style={{color:'#00619E'}}>
							{LanguageLabelComplements("contact")} {index}
							</h4>
						</center>
					</Col>
					<Col md={4}> <hr /> </Col>
					{ (deleteItem && !selfRegistrationWithContact) && (
						<Col md={1}>
							<Button className="float-right" size="sm" variant="danger" onClick={() => deleteItem(itemId)}>
								<FontAwesomeIcon icon={faTrash} />
							</Button>
						</Col>
					)}
				</Row>
				</>
			)}
			{(queue && eventLinkedQueueInWaitlist && initialValues) && (
				<Row>
					<Col md={4}></Col>
					<Col md={3}></Col>
					<Col md={4}></Col>
					<Col md={1}>
						<Button
							className="btn-info-tracker"
							size="sm"
							onClick={() => Meteor.call('createLogActionHistory', 'WaitlistsCollection',  'waitList', 'waitListView', null, null, EXECUTEDACTION['schedule'].id) }
							href={`/queue/register/schedule/${queue.selfRegistrationUrl.code}?contactId=${initialValues._id}`}
						>
							{ EXECUTEDACTION['schedule'].label }
						</Button>
					</Col>
				</Row>
			)}
			<Row>
				{hideInsuranceData && (
					<Col md={!showExtraTypeData? 12: 6} className="mb-3">
						{LanguageLabel("type")}
						<select
							className="form-control form-control-sm"
							name="type"
							value={type}
							onChange={e => setType(e.target.value)}
							ref={register({ required: true })}
							readOnly={readOnly}
							required ={evaluateIfRequired("type")}
						>
							<option value="">{LanguageLabelSelects("selectType")}</option>
							<option value="schoolTeacher">{LanguageLabelSelects("schoolTeacher")}</option>
							<option value="daycareProfessional">{LanguageLabelSelects("daycareProfessional")}</option>
							<option value="medicalProfessional">{LanguageLabelSelects("medicalProfessional")}</option>
							<option value="essentialWorker">{LanguageLabelSelects("essentialWorker")}</option>
							<option value="65+">65+</option>
							<option value="highRisk">{LanguageLabelSelects("highRisk")}</option>
							<option value="generalpopulation">{LanguageLabelSelects("generalPopulation")}</option>
							<option value="congregateCare">{LanguageLabelSelects("congregateCare")}</option>
						</select>
					</Col>
				)}
				{showExtraTypeData && (
					<Col md={6} className="mb-3">
						<label style={{color: requiredColor}}>{LanguageLabelComplements("extraTypeData")}</label>
						<input
							type="text"
							className="form-control form-control-sm"
							name="extraTypeData"
							defaultValue={initialValues.extraTypeData}
							ref={register}
							readOnly={readOnly || readOnlyPersonalData}
						/>

					</Col>
				)}
				<Col md={4} xs={12}>
				{LanguageLabel("name")}
				<input
						type="text"
						className="form-control form-control-sm"
						name="name"
						defaultValue={initialValues.name}
						value={nameValue}
						ref={register({ required: true })}
						readOnly={readOnly || readOnlyPersonalData}
						onChange={onChangeNameValue}
						required={evaluateIfRequired("name")}
					/>

				</Col>
				<Col md={4} xs={12} className="mt-3 mt-md-0">
				{LanguageLabel("lastName")}
					<input
						type="text"
						className="form-control form-control-sm"
						name="lastName"
						defaultValue={initialValues.lastName}
						value={lastNameValue}
						ref={register({ required: true })}
						readOnly={readOnly || readOnlyPersonalData}
						onChange={onChangeLastNameValue}
						required ={evaluateIfRequired("lastName")}
					/>

				</Col>
				<Col md={4} xs={12} className="mt-3 mt-md-0">
				{LanguageLabel("middlename")}
					<input
						type="text"
						className="form-control form-control-sm"
						name="middlename"
						defaultValue={initialValues.middlename}
						ref={register}
						required={evaluateIfRequired("middlename")}
						readOnly={readOnly}
					/>
				</Col>
				<Col md={4} xs={12} className="mt-3">
				{LanguageLabel("gender")}
					<select
						className="form-control form-control-sm"
						name="gender"
						defaultValue={initialValues.gender}
						readOnly={readOnly}
						ref={register}
						required={evaluateIfRequired("gender")}
						readOnly={readOnly}
					>
						<option value="">{LanguageLabelSelects("chooseGender")}</option>
						<option value="fem">{LanguageLabelSelects("female")}</option>
						<option value="male">{LanguageLabelSelects("male")}</option>
						<option value="oth">{LanguageLabelSelects("othGender")}</option>
						<option value="ag">{LanguageLabelSelects("agGender")}</option>
						<option value="asku">{LanguageLabelSelects("askuGender")}</option>
						<option value="ftm">{LanguageLabelSelects("ftmGender")}</option>
						<option value="gq">{LanguageLabelSelects("gqGender")}</option>
						<option value="female">{LanguageLabelSelects("femaleGender")}</option>
						<option value="AsMale">{LanguageLabelSelects("maleGender")}</option>
						<option value="mtf">{LanguageLabelSelects("mtfGender")}</option>
						<option value="unsp">{LanguageLabelSelects("unspGender")}</option>
					</select>
				</Col>
          <Col md={4} xs={12} className="mt-3">
            {LanguageLabel("email")}
              <input
                type="email"
                className="form-control form-control-sm"
                name="email"
                defaultValue={initialValues.email}
                value={emailValue}
                ref={register}
                readOnly={readOnly || readOnlyPersonalData}
                onChange={onChangeEmailValue}
                required ={evaluateIfRequired("email")}
              />
              {emailFormatError && (
                <p className="text-danger mt-2">{LanguageLabelComplements("invalidEmail")}</p>
              )}
          </Col>
				<Col md={4} xs={12} className="mt-3">
				{LanguageLabel("dob")}
					<div className = 'calendar-input-container' >
						<InputMask
							mask="99/99/9999"
							className="form-control form-control-sm input-date"
							name="dob"
							type={"text"}
							ref={register({ required: true })}
							required
							value={dobInput?dobInput:''}
							onChange={event => formatterDateInput(event.target.value)}
							required ={evaluateIfRequired("dob")}
						/>
						<div className = 'button-show-calendar'>
							<CustomDatePicker
								disabled={readOnly || readOnlyPersonalData}
								selectedDate={dob}
								setSelectedDate={formatterDateCalendar}
								customInput={<ButtonShowCalendar />}
							/>
						</div>
					</div>
				</Col>

				<Col xs={12} md={4} className="mt-3">
				{LanguageLabel("race")}
					<select
						className="form-control form-control-sm mb-2"
						name="race"
						defaultValue={initialValues.race}
						ref={register}
						readOnly={readOnly}
						required ={evaluateIfRequired("race")}
					>
						<option value="">{LanguageLabelSelects("chooseRace")}</option>
						<option value="A">{LanguageLabelSelects("asian")}</option>
						<option value="B">{LanguageLabelSelects("black")}</option>
						<option value="I">{LanguageLabelSelects("indian")}</option>
						<option value="P">{LanguageLabelSelects("hawaiian")}</option>
						<option value="W">{LanguageLabelSelects("white")}</option>
						<option value="O">{LanguageLabelSelects("otherRace")}</option>
						<option value="notAnswer">{LanguageLabelSelects("noRace")}</option>
					</select>
				</Col>

				<Col xs={12} md={4} className="mt-3">
				{LanguageLabel("ethnicity")}
					<select
						className="form-control form-control-sm"
						name="ethnicity"
						defaultValue={initialValues.ethnicity}
						ref={register}
						readOnly={readOnly}
						required ={evaluateIfRequired("ethnicity")}
					>
						<option value="">{LanguageLabelSelects("chooseEthnicity")}</option>
						<option value="H">{LanguageLabelSelects("hispanic")}</option>
						<option value="NH">{LanguageLabelSelects("nonHispanic")}</option>
						<option value="notAnswer">{LanguageLabelSelects("noEthnicity")}</option>
					</select>
				</Col>
				{/*<Col md={6} xs={12} className="mt-3 mt-md-0">
					<label>Status </label>
					<select
						className="form-control form-control-sm"
						name="status"
						defaultValue={initialValues.status}
						ref={register}
						readOnly={readOnly}
					>
						<option value="">None...</option>
						<option value="isolation">Isolation</option>
						<option value="quarantine">Quarantine</option>
					</select>
				</Col>*/}
				<Col xs={12} className="mt-3">
					<Form.Group as={Row}>
						<Col xs={1}>
						{LanguageLabel("homeless")}
						</Col>
						<Col xs={11}>
							<Form.Check
								inline
								type="radio"
								label={LanguageLabelComplements("yes")}
								name="homeless"
								value="yes"
								defaultChecked={isHomeless === 'yes'}
								onChange={e => setHomeless('yes')}
								ref={register}
								required ={evaluateIfRequired("homeless")}
							/>
							<Form.Check
								inline
								type="radio"
								label="No"
								name="homeless"
								value="no"
								defaultChecked={isHomeless === 'no'}
								onChange={e => setHomeless('no')}
								ref={register}
								required ={evaluateIfRequired("homeless")}
							/>
						</Col>
					</Form.Group>
				</Col>

				{isHomeless === 'no' && (
					<>
						{showCopy && (
							<Col md={6} xs={12} className="mt-3">
								<label>&nbsp;</label>
								<Button
									className="form-control form-control-sm"
									onClick={e => copyDataFromMain('address')}
								>
									{LanguageLabelComplements("copyFromMain")}
								</Button>
							</Col>
						)}
						<Col md={6} xs={12} className="mt-3">
						{LanguageLabel("address")}
							<input
								placeholder="101 Main Street"
								type="text"
								className="form-control form-control-sm"
								name="address"
								defaultValue={initialValues.address}
								ref={register}
								readOnly={readOnly || readOnlyPersonalData}
								required ={evaluateIfRequired("address")}
							/>
						</Col>
						<Col md={6} xs={12} className="mt-3">
						{LanguageLabel("address2")}
							<input
								placeholder="Apt, Suite, Floor, Suite, Bldg., etc."
								type="text"
								className="form-control form-control-sm"
								name="address2"
								defaultValue={initialValues.address2}
								ref={register}
								readOnly={readOnly || readOnlyPersonalData}
								required ={evaluateIfRequired("address2")}
							/>
						</Col>
						<Col md={6} xs={12} className="mt-3">
						{LanguageLabel("zip")}
							<input
								type = "text"
								className="form-control form-control-sm"
								name="zip"
								maxLength="5"
								value={zipcodeSearching ? zipcodeSearching : ''}
								ref={register}
								readOnly={readOnly || readOnlyPersonalData}
								onChange={onChangeZipcodeSearching}
								// this off the browser autocomplete
								required ={evaluateIfRequired("zip")}
								autoComplete="new-zipcode"
							/>
							{invalidZipcode && (
								<p className="text-danger mt-2">{LanguageLabelComplements("invalidZipcode")}</p>
							)}
						</Col>
						<Col md={6} xs={12} className="mt-3">
						{LanguageLabel("state")}
							<select
								className="form-control form-control-sm"
								name="state"
								defaultValue={initialValues.state}
								value={initialValues.state}
								ref={register}
								disabled={readOnly || readOnlyPersonalData}
								onChange= {(e) => {console.log(e.target.value)}}
								required ={evaluateIfRequired("state")}
							>
								<option value="">{LanguageLabelSelects("chooseState")}</option>
								{STATES.map(state => {
									return (
										<option key={state._id} value={state._id}>{state.name}</option>
									)
								})}
							</select>
						</Col>
						<Col md={6} xs={12} className="mt-3">
						{LanguageLabel("city")}
							<input
								type="text"
								className="form-control form-control-sm"
								name="city"
								defaultValue={initialValues.city}
								ref={register}
								readOnly={readOnly || readOnlyPersonalData}
								required ={evaluateIfRequired("city")}
							/>
						</Col>
					</>
				)}

				<Col md={6} xs={12}>
					<Row className="mt-3">
            <Col xs={4}>
              {LanguageLabel("phone")}
              <NumberFormat
                className="form-control form-control-sm"
                format="(###) ###-####"
                mask="_"
                name="phone"
                readOnly={readOnly || readOnlyPersonalData}
                value={phone}
                onValueChange={values => setPhone(values.value)}
                required ={evaluateIfRequired("phone") && !landline}
              />
            </Col>
            {phone && messageType != 'AWS_SNS' && (
              <Col xs={4}>
                {!landline ?
                (<label style={{color: requiredColor}}>*{LanguageLabelComplements("carrier")}</label>)
                :(<label style={{color: noRequiredColor}}>{LanguageLabelComplements("carrier")}</label>)}
                <select
                  className="form-control form-control-sm"
                  name="carrier"
                  defaultValue={initialValues.carrier}
                  onChange={values => setCarrier(values.target.value)}
                  ref={register}
                >
                  <option value="">{LanguageLabelSelects("chooseCarrier")}</option>
                  {allCarriers.map(carrier => {
                    return (
                      <option value={carrier._id} key={carrier._id}>
                        {carrier.name}
                      </option>
                    );
                  })}
                </select>
              </Col>
            )}
						<Col xs={4}>
							<Form.Check
								inline
								type="checkbox"
								label={LanguageLabelSelects("landline")}
								name="landline"
								value={landline}
                defaultChecked={landline}
								onChange={() => setLandline(!landline)}
							/>
						</Col>
					</Row>
					{landline && (
						<Row className="mt-3">
							<Col xs={12}>
								<label style={{color: landline ? requiredColor: noRequiredColor}}>{LanguageLabelComplements("landPhone")}</label>
								<NumberFormat
									className="form-control form-control-sm"
									format="(###) ###-####"
									mask="_"
									name="landphone"
									readOnly={readOnly}
									value={landphone}
									onValueChange={values => setLandphone(values.value)}
                  required ={landline}
								/>
							</Col>
						</Row>
					)}
				</Col>

				<Col md={6} xs={12} className="mt-3">
				{LanguageLabel("Date of contact")}
					<div className = 'calendar-input-container' >
						<InputMask
							mask="99/99/9999"
							className="form-control form-control-sm input-date"
							name="Date of contact"
							type={"text"}
							ref={register({ required: true })}
							value={contactDateInput?contactDateInput:''}
							onChange={event => formatterDateInputContactDate(event.target.value)}
							required ={evaluateIfRequired("Date of contact")}
							disabled={true}
						/>
						<div className = 'button-show-calendar'>
							<CustomDatePicker
								selectedDate={contactDate}
								setSelectedDate={formatterDateCalendarContactDate}
								customInput={<ButtonShowCalendar />}
								disabled={true}
							/>
						</div>
          </div>
				</Col>

				{/* Si no esta en registro */}
				{(!isInRegister) && (
					<Col md={12} xs={12} className="mt-3">
						<label></label>
							<Button block onClick={() => setshowInsurance(!showInsurance)}>
							{LanguageLabelComplements("insuranceInformation")}
							</Button>
					</Col>
				)}
				{/* Si SI esta en registro */}
				{/*isInRegister && showInsurance && (
					<Col md={6} xs={6} className="mt-3 mt-md-0">
						<label></label>
							<Button block onClick={() => setshowInsurance(!showInsurance)}>
								Hide insurance information
							</Button>
					</Col>
				)*/}
				{/*isInRegister && !showInsurance && (
					<Col md={6} xs={12} className="mt-3 mt-md-0">
						<label></label>
							<Button block onClick={() => setshowInsurance(!showInsurance)}>
								Insurance information
							</Button>
					</Col>
				)*/}
				{/*isInRegister && showInsurance && index > 1 && (
					<Col md={6} xs={6} className="mt-3 mt-md-0">
						<label></label>
							<Button block onClick={() => copyInsuranceData()}>
								Copy from main
							</Button>
					</Col>
				)*/}
				{/*isInRegister && showInsurance && index == 1 && (
					<Col md={6} xs={6} className="mt-3 mt-md-0">
						<label></label>
							<Button block onClick={() => copyHoldername()}>
								Copy name
							</Button>
					</Col>
				)*/}
				{
					!hideInsuranceData && (
						<Col md={12} className="mb-3 mt-3">
							<Form.Check
								inline
								type="checkbox"
								label={LanguageLabelComplements("noInsurance")}
								name="noInsurance"
								ref={register}
								onChange={() => setshowInsurance(!showInsurance)}
							/>
						</Col>
					)
				}

				{showInsurance && showCopy && (
					<Col md={6} xs={12} className="mt-3">
						<label>&nbsp;</label>
						<Button
							className="form-control form-control-sm"
							onClick={e => copyDataFromMain('insurance')}
						>
							{LanguageLabelComplements("insuranceFromMain")}
						</Button>
					</Col>)
				}

				{showInsurance && (
					<Col md={!showCopy ? 4 : 6 } xs={!showCopy ? 8 : 12} className="mt-3">
						<label style={{color: requiredColor}}>*{LanguageLabelComplements("holderName")}</label>
						<input
							type="text"
							className="form-control form-control-sm"
							name="holderName"
							defaultValue={initialValues.holderName}
							ref={register({required : true})}
							readOnly={readOnly}
							required
						/>
					</Col>)
				}
				{showInsurance && !showCopy && (
					<Col md={2} xs={4} className="mt-3">
						<label>&nbsp;</label>
						<Button
							className="form-control form-control-sm"
							onClick={e => copyHoldername()}
						>
							{LanguageLabelComplements("copyName")}
						</Button>
					</Col>)
				}
				{showInsurance && (
				<Col md={6} xs={12} className="mt-3">
					<label>{LanguageLabelComplements("insuranceType")}</label>
					<select
						className="form-control form-control-sm"
						name="insuranceType"
						defaultValue={initialValues.insuranceType}
						value = {initialValues.insuranceType}
						ref={register}
						readOnly={readOnly}
					>
						<option value="">{LanguageLabelSelects("chooseInsurance")}</option>
						<option value="subscriber">{LanguageLabelSelects("subscriber")}</option>
						<option value="spouse">{LanguageLabelSelects("spouse")}</option>
						<option value="other">{LanguageLabelSelects("anotherDependent")}</option>
					</select>
					{/*<input
						type="text"
						className="form-control form-control-sm"
						name="insuranceType"
						placeholder="Self/Spouse/Other"
						defaultValue={initialValues.insuranceType}
						ref={register}
						readOnly={readOnly}
					/>*/}
				</Col>)
				}
				{showInsurance && (
					<Col md={6} xs={12} className="mt-3">
						<label style={{color: requiredColor}}>*{LanguageLabelComplements("policyNumber")}</label>
						<input
							type="text"
							className="form-control form-control-sm"
							name="policyNumber"
							defaultValue={initialValues.policyNumber}
							ref={register({required : true})}
							readOnly={readOnly}
							required
						/>
					</Col>)
				}
				{showInsurance && (
					<Col md={!showCopy ? 4 : 6} xs={!showCopy ? 8 : 12} className="mt-3">
						<label>{LanguageLabelComplements("Policy dob")}</label>
						<div className = 'calendar-input-container' >
							<InputMask
								mask="99/99/9999"
								className="form-control form-control-sm input-date"
								name="Policy dob"
								type={"text"}
								ref={register({ required: true })}
								value={policyHolderDobInput?policyHolderDobInput:''}
								onChange={event => formatterDateInputPolicyHolderDob(event.target.value)}
							/>
							<div className = 'button-show-calendar'>
								<CustomDatePicker
									disabled={readOnly}
									selectedDate={policyHolderDob}
									setSelectedDate={formatterDateCalendarPolicyHolderDob}
									customInput={<ButtonShowCalendar />}
								/>
							</div>
						</div>
					</Col>)
				}
				{showInsurance && !showCopy && (
					<Col md={2} xs={4} className="mt-3">
						<label>&nbsp;</label>
						<Button
							className="form-control form-control-sm"
							onClick={e => copyHolderDob()}
						>
							{LanguageLabelComplements("copyDOB")}
						</Button>
					</Col>)
				}
				{showInsurance && (
					<Col md={6} xs={12} className="mt-3">
						<label>{LanguageLabelComplements("groupNumber")}</label>
						<input
							type="text"
							className="form-control form-control-sm"
							name="groupNumber"
							defaultValue={initialValues.groupNumber}
							ref={register}
							readOnly={readOnly}
						/>
					</Col>)
				}
				{showInsurance && (
					<Col md={6} xs={12} className="mt-3">
						<label>{LanguageLabelComplements("primaryInsurance")}</label>
						<select
							className="form-control form-control-sm"
							name="primaryInsurance"
							defaultValue={initialValues.primaryInsurance}
							value={initialValues.primaryInsurance}
							ref={register}
							readOnly={readOnly}
						>
							<option value="">{LanguageLabelSelects("choosePrimaryInsurance")}</option>
							<option value="medicaid">{LanguageLabelSelects("medicaid")}</option>
							<option value="medicare">{LanguageLabelSelects("medicare")}</option>
							<option value="other">{LanguageLabelSelects("anotherPrimaryInsurance")}</option>
						</select>
					</Col>)
				}
				{showInsurance && (
					<Col md={6} xs={12} className="mt-3">
						<label>{LanguageLabelComplements("insuranceName")}</label>
						<input
							type="text"
							className="form-control form-control-sm"
							name="insuranceName"
							defaultValue={initialValues.insuranceName}
							ref={register}
							readOnly={readOnly}
						/>
					</Col>)
				}
				{showInsurance && (
					<Col md={6} xs={12} className="mt-3">
						<label>{LanguageLabelComplements("insuranceCard")}</label>
						{loadingCard && <p>{LanguageLabelComplements("uploading")}</p>}
						{!loadingCard && (<input
							type="file"
							className="form-control form-control-sm"
							onChange={ (e) => uploadFile(e.target.files[0])}/>
						)}
					</Col>)
				}
				{urlCard && (
					<Col md={6} xs={12} className="mt-3">
						<label>{LanguageLabelComplements("uploadCard")}</label>
						<br />
						<a href={urlCard} target="_blank">
							<img style={{width: 100, height: 50}} src={urlCard} />
						</a>
					</Col>)
				}
				<Col md={12} xs={12} className="mt-3">
				{LanguageLabel("note")}
					<textarea
						className="form-control form-control-sm"
						name="note"
						defaultValue={initialValues.note}
						ref={register}
						readOnly={readOnly}
						required ={evaluateIfRequired("note")}
						rows={3}
					/>
				</Col>

				{showCustomSurvey && (
					<Col md={12}>
						<Formio
							form={customSurvey.formScheme}
							submission={customSurvey.formData}
							options={{ readOnly: true }}
						/>
					</Col>
				)}

			</Row>
		</form>
	);
});
