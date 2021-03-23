import './App.css';
import NewScheduleContact from './components/NewScheduleContact';

function App() {
  const agencyData = {};
  const allCarriers = {};
  const queueById = {};
  const messageType = '';
  const uploadFileToS3 = () => {}

  return (
    <NewScheduleContact
      index={1}
      agencydata={agencyData}
      allCarriers={allCarriers}
      queue={queueById}
      uploadFileToS3={uploadFileToS3}
      messageType={messageType}
    />
  );
}

export default App;
