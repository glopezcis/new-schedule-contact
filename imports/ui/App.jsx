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
				let allCarriers = result;				

				allCarriers = allCarriers.sort((a, b) => {
					const order = ["Metro PCS", "Boost", "Verizon", "Sprint", "T Mobile", "AT&T"];
					return (order.indexOf(b.name) - order.indexOf(a.name)) || (order.indexOf(b.name) - order.indexOf(a.name));
				});
		
				setAllCarriers(allCarriers);
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
