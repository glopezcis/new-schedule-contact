import React, {useEffect, useState} from 'react';
import NewScheduleContact from './components/NewScheduleContact';

export const App = () => {

	const [agencyData, setAgencyData] = useState(null);
	const [allCarriers, setAllCarriers] = useState(null);
	const [queueById, setQueueById] = useState(null);

	const waitlistId = 'ofofo5fo';

	const getAgencyData = () => {
    Meteor.call('agencyData', (error, result) => {
      if (error) {
        return alert(error);
      }

			if (result) {
        setAgencyData(result);
      }
    });
  };

	const getAllCarriers = () => {

    Meteor.call('allCarriers', (error, result) => {
      if (error) {
        return alert(error);
      }

			if (result) {
				setAllCarriers(result);
      }
    });
  };

	const getQueueById = (_id) => {
    Meteor.call('queueById', _id, (error, result) => {
      if (error) {
        return alert(error);
      }

			if (result) {
        setQueueById(result);
      }
    });
  };
	
	useEffect(() => {
		getAgencyData();
		getAllCarriers();
		getQueueById(waitlistId);
	}, []);
	
	return (
			<NewScheduleContact
				index={1}
				agencyData={agencyData}
				allCarriers={allCarriers}
				queue={queueById}
			/>
	)};
