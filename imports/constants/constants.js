export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export const ACTIONS = 'Actions'

export const EXECUTEDACTION = {
  create: {id: 01, label: 'Create'},
  delete: {id: 02, label: 'Delete'},
  update: {id: 03, label: 'Update'},
  eventOpened: {id: 04, label: 'Event opened'},
  eventClosed: {id: 05, label: 'Event closed'},
  blockSlots:  {id: 06, label: 'Block slots'},
  queueCopy: {id: 07, label: 'Copy'},
  excel: {id: 08, label: 'Excel'},
  clinicRoster: {id: 09, label: 'Clinic Roster'},
  cancelNoShow: {id: 10, label: 'Cancel / No show'},
  resendCorfirmation: {id: 11, label: 'Resend Confirmation'},
  printRequisition: {id: 12, label: 'Print Requisition'},
  printLabel: {id: 13, label: 'Print label'},
  completeScheduling: {id: 14, label: 'Complete scheduling'},
  saveAndComplete: {id: 15, label: 'Save and Complete'},
  sendContactsForm: {id: 16, label: 'Send Contacts Form'},
  nextPersonGroup: {id: 17, label: 'Next Person/Group'},
  notifyAllContacts: {id: 18, label: 'Notify all'},
  linkToEvent: {id: 19, label: 'Link to event'},
  routeAllToWaitlist: {id: 20, label: 'Route all to waitlist'},
  routeSingleItem: {id: 21, label: 'Route single item'},
  notify: {id: 22, label: 'Notify'},
  completed: {id: 23, label: 'Completed'},
  expireAllPasswords: {id: 24, label: 'Expire all passwords now'},
  expireAllPasswordsEvery: {id: 25, label: 'Expire all passwords'},
  timeoutUsersInactivity: {id: 26, label: 'Timeout users for inactivity'},
  defaultPasswordNewUsers: {id: 27, label: 'Default password for new users'},
  enableDisabletabs: {id: 28, label: 'Enable/Disable tabs'},
  checkIn: {id: 29, label: 'Check in'},
  exportCSV: {id: 30, label: 'Export CSV'},
  queryRegistry: {id: 31, label: 'Query Registry'},
  historical: {id: 32, label: 'Historical'},
  newContact: {id: 33, label: 'New Contact'},
  inactivateUser: {id: 34, label: 'Inactivate User'},
  movingToQueue: {id: 35, label: 'Moving to queue'},
  selfSchedule: {id: 36, label: 'Self Schedule'},
  sendNotifications: {id: 37, label: 'Send Notifications'},
  schedule: {id: 38, label: 'Schedule'},
  remove: {id: 39, label: 'Remove'},
}


export const ADMINPAGEID = {
  groups:'APID0001',
  queue: 'APID0002',
  queueAdmin: 'APID0003',
  waitList:'APID0004',
  waitListAdmin:'APID0005',
  nurses: 'APID0006',
  adminConfig: 'APID0007',
  customDashboard: 'APID0008',
  facility: 'APID0009',
  symptoms: 'APID0010',
  diseases: 'APID0011',
  labs: 'APID0012',
  panels: 'APID0013',
  immunizations: 'APID0014',
  inventoryList: 'APID0015',
  formImmunization: 'APID0016',
  user: 'APID0017',
  forms: 'APID0018',
  reports: 'APID0019',
  waitlistsContacts: 'APID0020',
  waitlistSummaries: 'APID0021',
  reminders: 'APID0022',
  queueContacts: 'APID0023',
}

//No repetir nombres con ADMINPAGEID
export const PAGECHILDRENID = {
  queueEdit: {id: 01, label: 'Edit', adminPageId: 'queueAdmin'},
  queueRegister: {id: 02, label: 'Register', adminPageId: 'queue'},
  queueList: {id: 03, label: 'Queue', adminPageId: 'queue'},
  queueContact: {id: 04, label: 'Contact', adminPageId: 'queue'},
  waitListEdit: {id: 05, label: 'WaitList Edit', adminPageId: 'waitListAdmin'},
  waitListOptions: {id: 06, label: 'WaitList Options', adminPageId: 'waitList'},
  waitListView: {id: 07, label: 'WaitList View', adminPageId: 'waitList'},
  waitListFollow: {id: 08, label: 'WaitList Follow', adminPageId: 'waitList'},
  waitListfollowupItem: {id: 09, label: 'WaitList Follow item', adminPageId: 'waitList'},
  symptomsEdit: {id: 10, label: 'Symptoms Edit', adminPageId: 'symptoms'},
  diseasesEdit: {id: 11, label: 'Diseases Edit', adminPageId: 'diseases'},
  labsEdit: {id: 12, label: 'Labs Edit', adminPageId: 'labs'},
  panelsEdit: {id: 13, label: 'Panels Edit', adminPageId: 'panels'},
  immunizationsEdit: {id: 14, label: 'Immunizations Edit', adminPageId: 'immunizations'},
  userEdit: {id: 15, label: 'User Edit', adminPageId: 'user'},
  nursesEdit: {id: 16, label: 'Nurses Edit', adminPageId: 'nurses'},
  groupsEdit: {id: 17, label: 'Groups Edit', adminPageId: 'groups'},
  formsEdit: {id: 18, label: 'Forms Edit', adminPageId: 'forms'},
}

export const noRequiredColor = '#888';
export const requiredColor = 'red';

export const STATES = [
  { name: "Alabama", _id: "AL"},
  { name: "Alaska", _id: "AK"},
  { name: "Arizona", _id: "AZ"},
  { name: "Arkansas", _id: "AR"},
  { name: "California", _id: "CA"},
  { name: "Colorado", _id: "CO"},
  { name: "Connecticut", _id: "CT"},
  { name: "Delaware", _id: "DE"},
  { name: "Florida", _id: "FL"},
  { name: "Georgia", _id: "GA"},
  { name: "Hawaii", _id: "HI"},
  { name: "Idaho", _id: "ID"},
  { name: "Illinois", _id: "IL"},
  { name: "Indiana", _id: "IN"},
  { name: "Iowa", _id: "IA"},
  { name: "Kansas", _id: "KS"},
  { name: "Kentucky", _id: "KY"},
  { name: "Louisiana", _id: "LA"},
  { name: "Maine", _id: "ME"},
  { name: "Maryland", _id: "MD"},
  { name: "Massachusetts", _id: "MA"},
  { name: "Michigan", _id: "MI"},
  { name: "Minnesota", _id: "MN"},
  { name: "Mississippi", _id: "MS"},
  { name: "Missouri", _id: "MO"},
  { name: "Montana", _id: "MT"},
  { name: "Nebraska", _id: "NE"},
  { name: "Nevada", _id: "NV"},
  { name: "New Hampshire", _id: "NH"},
  { name: "New Jersey", _id: "NJ"},
  { name: "New Mexico", _id: "NM"},
  { name: "New York", _id: "NY"},
  { name: "North Carolina", _id: "NC"},
  { name: "North Dakota", _id: "ND"},
  { name: "Ohio", _id: "OH"},
  { name: "Oklahoma", _id: "OK"},
  { name: "Oregon", _id: "OR"},
  { name: "Pennsylvania", _id: "PA"},
  { name: "Rhode Island", _id: "RI"},
  { name: "South Carolina", _id: "SC"},
  { name: "South Dakota", _id: "SD"},
  { name: "Tennessee", _id: "TN"},
  { name: "Texas", _id: "TX"},
  { name: "Utah", _id: "UT"},
  { name: "Vermont", _id: "VT"},
  { name: "Virginia", _id: "VA"},
  { name: "Washington", _id: "WA"},
  { name: "West Virginia", _id: "WV"},
  { name: "Wisconsin", _id: "WI"},
  { name: "Wyoming", _id: "WY"},
];
