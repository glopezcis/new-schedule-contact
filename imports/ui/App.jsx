import React, {useRef} from 'react';
import NewScheduleContact from './components/NewScheduleContact';
import {useAgencyData, useAllCarriers, useQueueById} from '../startup/client/hooks';


export const App = () => {

	return (
			<NewScheduleContact
				index={1}
				useAgencyData={useAgencyData}
				useAllCarriers={useAllCarriers}
				useQueueById={useQueueById}
			/>
	)};
