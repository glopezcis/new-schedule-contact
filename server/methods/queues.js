import { QueuesCollection } from '/imports/api/queues';
import { QueueContactsCollection } from '/imports/api/queueContact';
import { QueueItemsCollection } from '/imports/api/queueItems';
import { AgencyDataCollection } from '/imports/api/agencyData';
import { EXECUTEDACTION } from '/imports/constants/constants';
import shortid from 'shortid';
import moment from 'moment';
import { default as momenttz } from 'moment-timezone';

const QUEUE_ITEMS_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  OUT: 'OUT',
};

const MODE = {
  ONLY_SAVED: 'ONLY_SAVED',
  MAKE_PATIENT: 'MAKE_PATIENT',
};

const QUEUE_ITEMS_CHECKIN = {
  CHECK: 'CHECK',
  IGNORE: 'IGNORE',
};

function getNewQueueObject(json) {
  console.log('JOSN => ', json);
  json.active = true;
  json.items = [];
  json.enabled = true;

  if (json.enableSchedule && json.scheduleInputFormData.length > 0) {
    console.log('Dates => ', json.scheduleInputFormData);
    const allSlots = [];
    let slotIndex = 0;
    for(const schedule of json.scheduleInputFormData){
      const frecuency = Number(schedule.frecuency);
      const { begin, end } = schedule

      const startDate = moment(json.eventDate);
      startDate.hour(begin.getHours());
      startDate.minute(begin.getMinutes());
      startDate.second(0);

      const finishDate = moment(json.eventDate);
      finishDate.hour(end.getHours());
      finishDate.minute(end.getMinutes());
      finishDate.second(0);

      let iterateDate = moment(startDate);

      while(iterateDate < finishDate) {
        const item = {
          from: iterateDate.toDate(),
        };
        iterateDate.add(frecuency, 'm');
        item.to = iterateDate.toDate();
        item.total = Number(schedule.slots);
        item.used = 0;
        item.slotIndex = slotIndex;
        allSlots.push(item);

        slotIndex++;
      }
    }
    json.allSlots = allSlots;
    console.log('ALL slots  => ', json.allSlots);
  }

  return json;
};

const validateOpenQueueSlots = function(currentQueue, slots) {
  let releasedSlots = 0;

  const items = currentQueue.items || [];

  currentQueue.slotsData.forEach((slot) => {
    releasedSlots = releasedSlots + slot.number;
  });

  const noCanceledItems = items.filter((tempItem) => {
    return tempItem.status != QUEUE_ITEMS_STATUS.OUT;
  });

  if (noCanceledItems.length >= releasedSlots) {
    throw new Meteor.Error('full-queue', `Full Queue ${currentQueue.name}`);
  }

  slots.forEach(selectedSlot => {
    const queueSlot = currentQueue.allSlots.find(tempSlot => tempSlot.slotIndex == selectedSlot.slotIndex);
    if (queueSlot.used + 1 > queueSlot.total) {
      throw new Meteor.Error('full-slot', `Slot no longer available ${currentQueue.name}`);
    }
  });
};

const removeWailistByContactId = function(waitlistContactId){
  let sourceWaitlistId = '';
  if (waitlistContactId) {
    const waitlistItem = WaitlistsItemsCollection.findOne({ contact: waitlistContactId });
    const waitlist = WaitlistsCollection.findOne({ 'items.itemId': waitlistItem._id })

    if (waitlist) {
      sourceWaitlistId = waitlist._id;
      // Quitar de items
      const newItems = waitlist.items.filter(item => {
        return item.itemId != waitlistItem._id;
      });

      const movingToQueue = waitlist.movingToQueue || [];
      movingToQueue.push(waitlistItem._id);

      WaitlistsCollection.update({ _id: waitlist._id }, {
        $set: {
          items: newItems,
          movingToQueue: movingToQueue,
        }
      });

      let detailAction = newItems;
      Meteor.call('createLogActionHistory', 'WaitlistsCollection',  'waitList', null, waitlist._id, null,  EXECUTEDACTION['movingToQueue'].id, detailAction);

      detailAction = `waitlistId ${waitlist._id}, contactId ${waitlist._id}`;
      Meteor.call('createLogActionHistory', 'WaitlistSummariesCollection',  'waitlistSummaries', null, null, null,  EXECUTEDACTION['delete'].id, detailAction);

      //Quitarlo del resumen
      WaitlistSummariesCollection.remove({
        waitlistId: waitlist._id,
        waitlistItemId: waitlistItem._id,
        contactId: waitlistContactId,
      });
    }
  }
  return sourceWaitlistId;
}

const registerQueueItem = function(json, queue, timezone, isFirstDose = true, sDContactIds = [], queueId) {
  let contactIds = [];
  let sourceWaitlistId = '';

  // Crear un item por cada contacto, por que podrian elegir horarios diferentes
  json.contacts.forEach((contact, index) => {
    let contactId = '';

    const items = queue.items || [];

    // Valido cuando se desea registrar el register y Seft-register de la segunda dosis
    if (contact._id || (isFirstDose == false && sDContactIds && index < sDContactIds.length)){
      contactId = contact._id ?? sDContactIds[index];
    } else {
      contactId = QueueContactsCollection.insert(contact);

      Meteor.call('createLogActionHistory', 'QueueContactsCollection',  'queueContacts', null, contactId, null,  EXECUTEDACTION['create'].id);
    }

    contactIds.push(contactId);

    const queueItem = {
      car: '',
      note: 'Self register',
      owner: this.userId,
      date: Date.now(),
      contacts: [contactId],
    };

    const slot = isFirstDose ? json.selectedSlots[index] : json.sDoseSlots[index];

    //evaluar si ya existe
    const queueItemId = QueueItemsCollection.insert(queueItem);
    items.push({
      itemId: queueItemId,
      status: QUEUE_ITEMS_STATUS.ACTIVE,
      selectedSlot: slot,
    });

    // Quitar 1 slot
    const { allSlots } = queue;
    const newAllSlots = allSlots.map(itemSlot => {
      if (itemSlot.slotIndex == slot.slotIndex) {
        itemSlot.used = itemSlot.used + 1;
      }
      return itemSlot;
    });

    QueuesCollection.update({ _id: queue._id }, { $set: {
      items,
      allSlots: newAllSlots,
    } });

    Meteor.call('sendNotificationsNewAppointment', {
      phone: contact.phone,
      name: `${contact.name} ${contact.lastName}`,
      email: contact.email,
      from: slot.from,
      location: queue.location || '',
      carrier: contact.carrier || ''
    }, timezone, queueId);

    //Quitar de waitlist si vino de alla
    if (isFirstDose) {
      sourceWaitlistId = removeWailistByContactId(json.waitlistContactId);
    }
  });

  return {
    contactIds,
    sourceWaitlistId,
  };
};

const getTimeWithCurrentDate = function (currentDate, currentTime) {
  if(!currentDate)
    return currentTime;

  const date = moment(currentDate);

  if(date.format('MM/DD/YYYY') != moment(currentTime).format('MM/DD/YYYY')) {
    date.hour(currentTime.getHours());
    date.minute(currentTime.getMinutes());
    date.second(0);
    date.millisecond(0);

    return date.toDate();
  }

  return currentTime;
};

const getDateWithTz = function (current, timzone = 'America/Los_Angeles') {
  if(!current)
    return current;

  const actual = new Date(current);
  let result = moment().tz(timzone);
  result.date(actual.getDate());
  result.month(actual.getMonth());
  result.year(actual.getFullYear());
  result.hour(0);
  result.minute(0);
  result.second(0);
  result.millisecond(0);

  return result.toDate();
};

const getDetail = function(queueId, page, sizePerPage, filter) {
  const defaultItem = {
    _id: '-',
    number: 0,
    contactName: ``,
    car: '',
    note: '',
    arrivalTime: 0,
    contacts: 0,
  };

  const bottomEdge = sizePerPage && page &&  (page - 1) * sizePerPage;
  const topEdge = sizePerPage && bottomEdge + sizePerPage;

  const queue = QueuesCollection.findOne({_id: queueId});

  let queueStatus = [];

  if (filter.status) {
    queueStatus = queue.items.filter(queueItem => {
      return filter.status.includes(queueItem.status);
    });
  } else {
    queueStatus = queue.items.filter(queueItem => {
      return ['ACTIVE' , 'COMPLETED', 'OUT'].includes(queueItem.status);
    });
  }

  const ids = queueStatus.map( item => item.itemId );
  const queueItems = QueueItemsCollection.find({ _id: { $in: ids } }).fetch();
  const contactsIds = queueItems.map(item => item.contacts[0]);
  const contacts = QueueContactsCollection.find({ _id: { $in: contactsIds } }).fetch();

  ///----
  const allQueueItemsIds = queueStatus.map( item => item.itemId );
  const allQueueItems = QueueItemsCollection.find({ _id: { $in: allQueueItemsIds } }).fetch();

  return {
    defaultItem,
    bottomEdge,
    topEdge,
    queue,
    contacts,
    allQueueItems,
  };
};

Meteor.methods({

  getSMSType (){
    console.log(process.env.SEND_SMS);
    return process.env.SEND_SMS;
  },

  queueById(queueId) {
    return QueuesCollection.findOne(queueId);
  },

  createNewQueue(data) {
    const newQueue = getNewQueueObject(data.queue);
    const queueId = QueuesCollection.insert(newQueue);

    if(data.sDQueue) {
      const newSDQueue = getNewQueueObject(data.sDQueue);
      newSDQueue['parentQueueId'] = queueId;
      const sDQueueId = QueuesCollection.insert(newSDQueue);

      Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', null, sDQueueId, null,  EXECUTEDACTION['create'].id);
    }

    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', null, queueId, null,  EXECUTEDACTION['create'].id);

    return queueId;
  },

  deleteQueue(queueId) {
    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', null, queueId, null,  EXECUTEDACTION['delete'].id);
    return QueuesCollection.update({ _id: queueId }, {$set: {enabled: false}});
  },

  createQueItem(json, queueId) {
    const queue = QueuesCollection.findOne(queueId);
    const items = queue.items || [];

    queue.slotsData.forEach((slot) => {
      if (items.length >= slot.number) {
        throw new Meteor.Error('full-queue', 'Full Queue');
      }
    });

    // Ponerlo como indice
    let queueNumber = Number(json.queueNumber);
    if (!queueNumber) {
      // si no tiene, el nuevo indice es la longitud
      queueNumber = items.length;
    } else {
      // si si tiene indice, restarle 1
      queueNumber = queueNumber - 1;
    }

    // Si no existe el indice
    if (!items[queueNumber]) {
      const queueItem = {
        car: json.car || '',
        note: json.note || '',
        owner: this.userId,
        date: Date.now(),
        contacts: json.contacts.map(contact => {
          const queueContactsId= QueueContactsCollection.insert(contact);

          Meteor.call('createLogActionHistory', 'QueueContactsCollection',  'queueContacts', null, queueContactsId, null,  EXECUTEDACTION['create'].id);

          return queueContactsId;
        })
      };

      const queueItemId = QueueItemsCollection.insert(queueItem);
      items.push({
        itemId: queueItemId,
        status: QUEUE_ITEMS_STATUS.ACTIVE
      });

      Meteor.call('createLogActionHistory', 'QueuesCollection',  'queue', null, queueId, null,  EXECUTEDACTION['update'].id);

      QueuesCollection.update({ _id: queueId }, { $set: { items } });
    } else {
      const item = items[queueNumber];
      const queueItem = QueueItemsCollection.findOne(item.itemId);
      let newContacts = json.contacts.map(contact => {

        const queueContactsId= QueueContactsCollection.insert(contact);

        Meteor.call('createLogActionHistory', 'QueueContactsCollection',  'queueContacts', null, queueContactsId, null,  EXECUTEDACTION['create'].id);

        return queueContactsId;
      });
      newContacts = [...queueItem.contacts, ...newContacts];
      QueueItemsCollection.update({_id: item.itemId}, { $set: { contacts: newContacts } } );
    }

    return {
      number: json.queueNumber? json.queueNumber : items.length
    };
  },

  createQueueScheduleItem(json, timezone = 'America/Los_Angeles') {
    if (!timezone) {
      timezone = 'America/Los_Angeles';
    }

    const queue = QueuesCollection.findOne({ 'selfRegistrationUrl.code': json.queueCode });

    const sDQueue = json.sDoseSlots.length > 0 ? QueuesCollection.findOne({ 'parentQueueId': queue._id }) : null;

    //Validar disponibilidad de la primera dosis en la queue
    validateOpenQueueSlots(queue, json.selectedSlots);

    //Validar disponibilidad de la segunda dosis en la sDQueue
    if(sDQueue && queue.requireSecondDose && json.sDoseSlots.length > 0)
      validateOpenQueueSlots(sDQueue, json.sDoseSlots);

    const result = registerQueueItem(json, queue, timezone, queue._id);

    if(sDQueue && queue.requireSecondDose  && json.sDoseSlots.length > 0)
      registerQueueItem(json, sDQueue, timezone, false, result.contactIds, sDQueue._id);

    return {
      success: true,
      sourceWaitlistId: result.sourceWaitlistId,
    };
  },

  sendNotificationsNewAppointment(notificationData, timezone = 'America/Los_Angeles', queueId = null) {
    let detailAction = '';
    if (notificationData.email) {
      const dataToEmail = {
        name: `${notificationData.name}`,
        day: `${momenttz(notificationData.from).tz(timezone).format('MM/DD/YYYY')}`,
        hour: `${momenttz(notificationData.from).tz(timezone).format('hh:mm A')}`,
        subject: `${Meteor.call('getTitleFromType', 'notifyNewAppoiment')}`,
        agencyName: `${Meteor.call('getTitleFromType', 'notifyNewAppoiment')}`,
        location: notificationData.location,
      };
      Meteor.call('notifyNewAppoiment', notificationData.email, dataToEmail);

      detailAction = `Email: ${notificationData.email} for ${notificationData.name}`;
      Meteor.call('createLogActionHistory', 'QueuesCollection',  'queue', 'queueList',  queueId, null, EXECUTEDACTION['sendNotifications'].id, detailAction);
    }

    if (notificationData.phone) {
      const dataToSMS = {
        name: `${notificationData.name}`,
        day: `${momenttz(notificationData.from).tz(timezone).format('MM/DD/YYYY')}`,
        hour: `${momenttz(notificationData.from).tz(timezone).format('hh:mm A')}`,
        agency: `${Meteor.call('getTitleFromType', 'notifyNewAppoiment')}`,
        location: notificationData.location,
        carrier: notificationData.carrier
      };

      Meteor.call('sendNotifyNewAppointment', notificationData.phone, dataToSMS, 'queue');

      detailAction = `Phone: ${notificationData.phone} for ${notificationData.name}`;
      Meteor.call('createLogActionHistory', 'QueuesCollection',  'queue', 'queueList',  queueId, null, EXECUTEDACTION['sendNotifications'].id, detailAction);
    }
  },

  editQueue(json, queueId) {
    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', 'queueEdit', queueId, null,  EXECUTEDACTION['update'].id);

    return QueuesCollection.update({ _id: queueId }, { $set: json });
  },

  changeQueueStatus(queueId, newStatus) {
    const queue = QueuesCollection.findOne({ _id: queueId });
    const queryUpdate = {
      active: newStatus,
    };

    if (newStatus) {
      // Lo esta activando otra vez
      let openDates = queue.openDates || [];
      openDates.push(Date.now());
      queryUpdate.openDates = openDates;
    } else {
      // Lo esta cerrando, marcar a los contactos para aparecer en widget
      // Solo los completados
      const queueItemsIds = queue.items.filter(item => item.status == 'COMPLETED').map(item => item.itemId);
      QueueItemsCollection.find({ _id: { $in: queueItemsIds } }).forEach(queueItem => {
        // Solo los que tienen lab
        const labs = queueItem.labs || [];
        const contactsIds = labs.map(lab => lab.contactId);
        QueueContactsCollection.update(
          { _id: { $in: contactsIds } },
          { $set: { showInWidget: true } },
          { multi: true }
        );
      });
    }

    QueuesCollection.update({ _id: queueId }, { $set: queryUpdate });

    if (newStatus) {
      Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', 'queueEdit', queueId, null,  EXECUTEDACTION['eventOpened'].id);
    } else {
      Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', 'queueEdit', queueId, null,  EXECUTEDACTION['eventClosed'].id);
    }

    return {
      newStatus,
    };
  },

  markItemAsOut(queueId, queueItemId) {
    const queue = QueuesCollection.findOne(queueId);
    const newItems = queue.items.map(item => {
      if (item.itemId === queueItemId) {
        item.status = QUEUE_ITEMS_STATUS.OUT;
      }
      return item;
    });
    return QueuesCollection.update({_id: queueId}, { $set: { items: newItems } });
  },

  markScheduleItemAsOut(queueId, queueItemId, queueContactName, mode) {
    const queue = QueuesCollection.findOne(queueId);
    const queueItem = queue.items.find(item => item.itemId == queueItemId);
    const { selectedSlot } = queueItem;

    const newItems = queue.items.map(item => {
      if (item.itemId === queueItemId) {
        item.status = (mode == 'CLOSED') ? QUEUE_ITEMS_STATUS.OUT : QUEUE_ITEMS_STATUS.ACTIVE;
      }
      return item;
    });

    let newSlots = '';
    //Restar 1 en usados
    if (mode == 'CLOSED') {
      newSlots = queue.allSlots.map(slot => {
        if (slot.slotIndex == selectedSlot.slotIndex) {
          slot.used = slot.used - 1;
        }
        return slot;
      });
    }
    if (mode == 'OPEND') {
      newSlots = queue.allSlots.map(slot => {
        if (slot.slotIndex == selectedSlot.slotIndex ) {
          if (slot.used  + 1 >  slot.total) {
            throw new Meteor.Error('full-slot', `Slot no longer available ${queue.name}`);
          } else {
            slot.used = slot.used + 1;
          }
        }
        return slot;
      });
    }

    const detailAction = `for ${queueContactName}`;
    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queue', 'queueList', queueId, null,  EXECUTEDACTION['cancelNoShow'].id, detailAction);

    return QueuesCollection.update({_id: queueId}, {
      $set: {
        items: newItems,
        allSlots: newSlots,
      }
    });
  },

  markCheckinItem(queueId, queueItemId, modeCheckModal) {
    const queue = QueuesCollection.findOne(queueId);
    const newItems = queue.items.map(item => {
      if (item.itemId === queueItemId) {
        if (modeCheckModal == 'CLOSED') {
          item.checkin = QUEUE_ITEMS_CHECKIN.CHECK;
          item.checkinDate = Date.now();
        }
        if (modeCheckModal == 'OPEND') {
          item.checkin && delete item.checkin;
          item.checkinDate && delete item.checkinDate;
        }
      }
      return item;
    });
    return QueuesCollection.update({_id: queueId}, { $set: { items: newItems } });
  },

  markItemAsCompleted(queueId, queueItemId) {
    const queue = QueuesCollection.findOne(queueId);
    const newItems = queue.items.map(item => {
      if (item.itemId === queueItemId) {
        item.status = QUEUE_ITEMS_STATUS.COMPLETED;
      }
      return item;
    });
    return QueuesCollection.update({_id: queueId}, { $set: { items: newItems } });
  },

  markImmunizationItemAsCompleted(queueId, queueItemId, recordId) {
    const queue = QueuesCollection.findOne(queueId);
    const newItems = queue.items.map(item => {
      if (item.itemId === queueItemId) {
        item.status = QUEUE_ITEMS_STATUS.COMPLETED;
        item.recordId = recordId;
      }
      return item;
    });
    return QueuesCollection.update({_id: queueId}, { $set: { items: newItems } });
  },

  saveLabInContact(currentData, labFacilityId, queueId, queueItemId) {
    const queueItem = QueueItemsCollection.findOne(queueItemId);
    const { contactId, contact, lab } = currentData;
    lab.forms = [];
    lab.formsAnswers = [];

    const data = {
      patient: '',
      requestedDate: new Date(),
      labFacility: labFacilityId,
      labFacilityName: '',
      orderingProvider: Meteor.userId(),
      statLabFlag: false,
      status: 'open',
      labStatus: 'received',
      locked: false,
      labsSelected: [lab],
      panelsSelected: [],
      owner: Meteor.userId(),
    };

    const allLabs = queueItem.labs || []; // [ { contactId: string, labHistoryId: string } ]
    const labForContact = allLabs.find(labItem => labItem.contactId == contactId);
    if (!labForContact) {
      // No tiene, insertar
      const labHistoryId = LabHistoriesCollection.insert(data);
      allLabs.push({ contactId, labHistoryId });
      QueueItemsCollection.update({ _id: queueItemId }, { $set: { labs: allLabs }});
    } else {
      // Ya tiene, actualizar
      LabHistoriesCollection.update({ _id: labForContact.labHistoryId }, { $set: data });
    }

    QueueContactsCollection.update({ _id: contactId }, { $set: contact });

    Meteor.call('createLogActionHistory', 'QueueContactsCollection',  'queueContacts', null, contactId, null,  EXECUTEDACTION['update'].id);

    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queue', 'queueContact', queueId, queueItemId, EXECUTEDACTION['saveAndComplete'].id);

    return data;
  },

  updateQueueContact(data, queueId, queueItemId, contactId, mode) {
    const updateQuery = {
      $set: {
        labsSelected: [ data.labSelected ]
      }
    };
    LabHistoriesCollection.update({ _id: data.labHistoryId }, updateQuery);
    QueueContactsCollection.update({ _id: contactId }, { $set: data.contactData });

    const contact = QueueContactsCollection.findOne(contactId);

    const queueItem = QueueItemsCollection.findOne(queueItemId);
    const alreadyPatients = queueItem.alreadyPatients || [];
    const alreadyCompleted = queueItem.alreadyCompleted || [];

    if (mode == MODE.MAKE_PATIENT) {
      alreadyPatients.push(contactId);
      QueueItemsCollection.update({ _id: queueItemId }, { $set: { alreadyPatients: alreadyPatients } });
      const newUserId = convertDataIntoPerson(contact, 1);
      QueueContactsCollection.update({_id: contactId}, { $set: { smartUserId: newUserId } });
    }

    if (mode == MODE.ONLY_SAVED) {
      alreadyCompleted.push(contactId);
      QueueItemsCollection.update({ _id: queueItemId }, { $set: { alreadyCompleted: alreadyCompleted } });
    }

    return true;
  },

  updateFollowUpQueueStatus(contactId, stage) {
    const findQuery = { _id: contactId };
    const contact = QueueContactsCollection.findOne(findQuery);
    const newStages = contact.stages || {};
    newStages[stage] = {
      date: Date.now()
    };
    const updated = QueueContactsCollection.update(findQuery, { $set: { stages: newStages } });

    // Si lo esta cerrando y ya es paciente, cerrar en el paciente
    if (stage == 'closed' && contact.smartUserId) {
      Meteor.call('markPatientAsClosed', contact.smartUserId, true);
    }

    return updated;
  },

  undoFollowUpQueueStatus(contactId, stage) {
    const findQuery = { _id: contactId };
    const contact = QueueContactsCollection.findOne(findQuery);
    const newStages = contact.stages || {};
    delete newStages[stage];

    const updated = QueueContactsCollection.update(findQuery, { $set: { stages: newStages } });
    // Si lo esta cerrando y ya es paciente, cerrar en el paciente
    if (stage == 'closed' && contact.smartUserId) {
      Meteor.call('undoPatientAsClosed', contact.smartUserId, true);
    }

    return updated;
  },

  // In the queue
  generateExcelQueueItems(queueId, timezone) {
    if (!timezone) {
      timezone = 'America/Los_Angeles';
    }

    const queue = QueuesCollection.findOne(queueId);
    const { items, type } = queue;
    let allItems = [];

    items.forEach((item, index) => {
      const { itemId, status, selectedSlot, checkinDate } = item;
      const queueItem = QueueItemsCollection.findOne(itemId);
      const { contacts, date } = queueItem;

      contacts.forEach(contactId => {
        const contact = QueueContactsCollection.findOne(contactId);
        const row = convertContactToRow(contact, status, index);

        if (type == 'lab') {
          date ? row.push(`${momenttz(date).tz(timezone).format('hh:mm A')}`) : row.push('');
        }

        if (type == 'immunization') {
          selectedSlot ? row.push(`${momenttz(selectedSlot.from).tz(timezone).format('hh:mm A')}`) : row.push('');
          checkinDate ? row.push(`${momenttz(checkinDate).tz(timezone).format('hh:mm A')}`) : row.push('');
        }

        allItems.push(row);
      });
    });

    allItems.unshift(getQueueItemsLabels(type));

    return {
      contacts: allItems
    };
  },

  generateExcelQueueItemsByTime(queueId, timezone) {
    if (!timezone) {
      timezone = 'America/Los_Angeles';
    }

    const queue = QueuesCollection.findOne(queueId);
    const { items, type } = queue;
    let allItems = [];
    let arrival = null;
    let slotFromValue = null;
    let checkIn = null;
    let typeDoc = type;

    items.forEach((item, index) => {
      const { itemId, status, selectedSlot, checkinDate } = item;
      const queueItem = QueueItemsCollection.findOne(itemId);
      const { contacts, date } = queueItem;

      contacts.forEach(contactId => {
        const contact = QueueContactsCollection.findOne(contactId);

        if (type == 'lab') {
          arrival = date ? `${momenttz(date).tz(timezone).format('hh:mm A')}` : '';
        }

        if (type == 'immunization') {
          slotFromValue = (selectedSlot && selectedSlot.from) ? `${momenttz(selectedSlot.from).tz(timezone).format('hh:mm A')}` : '';
          checkIn = checkinDate ? `${momenttz(checkinDate).tz(timezone).format('hh:mm A')}` : '';
        }

        let statusLabel = 'In the line';
        switch(status) {
          case QUEUE_ITEMS_STATUS.OUT:
            statusLabel = 'Cancel / No Show';
            break;
          case QUEUE_ITEMS_STATUS.ACTIVE:
            statusLabel = 'In the line';
            break;
          case QUEUE_ITEMS_STATUS.COMPLETED:
            statusLabel = 'Completed';
            break;
        }

        const row = {
          // PARA LAB NO HAY selectedSlot.from VALIDAR
          timestamp: (selectedSlot && selectedSlot.from) ? (new Date(selectedSlot.from)).getTime(): '',
          time: type == 'lab' ? arrival : slotFromValue,
          name: contact.name,
          lastname: contact.lastName,
          status,
          address: contact.address,
          address2: contact.address2,
          state: contact.state,
          city: contact.city,
          zip: contact.zip,
          phone: contact.phone,
          note: contact.note,
          dob: contact.dob ? moment(contact.dob).format('MMM/DD/YYYY') : '',
          statusLabel,
        };

        (type == 'lab')  ? Object.assign(row, {arrival : arrival}) : Object.assign(row, {checkIn : checkIn});

        allItems.push(row);
      });
    });

    allItems = allItems.sort((a, b) => a.timestamp - b.timestamp);

    const groupedBy = allItems.reduce((acc, cur) => {
      let items = {
        timestamp: cur.timestamp,
        time: cur.time,
        name: cur.name,
        lastname: cur.lastname,
        status: cur.status,
        address: cur.address,
        address2: cur.address2,
        state: cur.state,
        city: cur.city,
        zip: cur.zip,
        phone: cur.phone,
        note: cur.note,
        dob: cur.dob,
        statusLabel: cur.statusLabel,
      };

      (type == 'lab')  ? Object.assign(items, {arrival : cur.arrival}) : Object.assign(items, {checkIn : cur.checkIn});

      acc[cur.time] ? acc[cur.time]['clients'].push(items) : acc[cur.time] = { time: cur.time, clients: [items] };
      return acc;
    }, {});

    let rows = Object.values(groupedBy);

    rows.map(item => {
      let clientName = item.clients.slice(0);
      clientName.sort(function(a,b) {
        let x = a.name.toLowerCase();
        let y = b.name.toLowerCase();
        return x < y ? -1 : x > y ? 1 : 0;
      });
      item.clients = clientName;
    });

    return {
      rows: {rows},
      type: typeDoc,
    };
  },

  // Queue already close
  generateExcelFollowUpItems(queueId) {

  },

  toggleQueueContactInWidget(queueId) {
    const queueContact = QueueContactsCollection.findOne(queueId);
    const showInWidget = !!queueContact.showInWidget;
    return QueueContactsCollection.update({ _id: queueId }, { $set: { showInWidget: !showInWidget } });
  },

  getQueuesContactsForWidgetOld() {
    const alreadyPatients = QueueContactsCollection.find({ smartUserId: { $exists: true } }).fetch();
    const userIds = alreadyPatients.map(contact => contact.smartUserId);
    const patients = Meteor.users.find({ _id: { $in: userIds } }).fetch();

    const pendingPatients = patients.filter(patient => {
      const { profile } = patient;
      const { patientId} = profile;
      return patientId.includes('tempID_');
    });

    const patientsToTable = pendingPatients.map(patient => {
      const contact = alreadyPatients.find(contact => contact.smartUserId == patient._id );
      const queueItem = QueueItemsCollection.findOne({ contacts: contact._id });
      const queue = QueuesCollection.findOne({ 'items.itemId': queueItem._id });

      const { profile } = patient;
      return {
        patientId: patient._id,
        name: profile.name,
        lastName: profile.lastName,
        eventName: queue.name,
        queueId: queue._id,
        queueItemId: queueItem._id,
        contactId: contact._id,
      }
    });

    return {
      contacts: patientsToTable
    };
  },

  getQueuesContactsForWidget() {
    const queueContacts = QueueContactsCollection.find({
      showInWidget: true,
      smartUserId: { $exists: false}
    }).fetch();

    let patientsToTable = queueContacts.map(contact => {
      const queueItem = QueueItemsCollection.findOne({ contacts: contact._id });
      const queue = QueuesCollection.findOne({ 'items.itemId': queueItem._id });

      if (!queue || !queueItem) {
        return null;
      }

      return {
        _id: contact._id,
        smartUserId: contact.smartUserId,
        name: contact.name,
        lastName: contact.lastName,
        eventName: queue.name,
        queueId: queue._id,
        queueItemId: queueItem._id,
        contactId: contact._id,
      }
    });

    patientsToTable = patientsToTable.filter(item => !!item);

    return {
      contacts: patientsToTable
    };
  },

  getDataForRequisite(reportData) {
    const { contact, lab, report } = reportData;
    const agencyData = AgencyDataCollection.findOne();
    const { general } = agencyData;

    let timezone = 'America/LosAngeles';
    if (reportData.timezone) {
      timezone = reportData.timezone;
    }

    //Si no tiene, poner nada
    if (!lab.specimenSourceSelected) {
      lab.specimenSourceSelected = '';
    }

    let specimenLabel = '';
    if (lab.specimenSourceSelected.includes('AN')) {
      specimenLabel = 'AN';
    } else if (lab.specimenSourceSelected.includes('NP') || lab.specimenSourceSelected.includes('NO')) {
      specimenLabel = 'NO';
    }

    //Questions
    let firstTest = '';
    if (lab.firstTest == 'yes') {
      firstTest = 'Y';
    } else if (lab.firstTest == 'no') {
      firstTest = 'N';
    }

    let employedHealthcare = '';
    if (lab.employedHealthcare == 'yes') {
      employedHealthcare = 'Y';
    } else if (lab.employedHealthcare == 'no') {
      employedHealthcare = 'N';
    }

    let symptomatic = '';
    if (lab.symptomatic == 'yes') {
      symptomatic = 'Y';
    } else if (lab.symptomatic == 'no') {
      symptomatic = 'N';
    }

    let hospitalized = '';
    if (lab.hospitalized == 'yes') {
      hospitalized = 'Y';
    } else if (lab.hospitalized == 'no') {
      hospitalized = 'N';
    }

    let residentCongregate = '';
    if (lab.residentCareSetting == 'yes') {
      residentCongregate = 'Y';
    } else if (lab.residentCareSetting == 'no') {
      residentCongregate = 'N';
    }

    let pregnant = '';
    if (lab.pregnant == 'yes') {
      pregnant = 'Y';
    } else if (lab.pregnant == 'no') {
      pregnant = 'N';
    }

    let icu = '';
    if (lab.icu == 'yes') {
      icu = 'Y';
    } else if (lab.icu == 'no') {
      icu = 'N';
    }

    return {
      laboratoryData:{
        account: general.account || '',
        name: general.name || '',
        address: `${general.address1} ${general.address2}`,
        city: general.city || '',
        state: general.state || '',
        zip: general.zip || '',
        phone: general.phone || '',
        npi: general.npi || '',
      },
      reportData: {
        dateCollected: report.labelDateSpecimen,
        hour: report.hourSpecimen,
        minutes: report.minuteSpecimen,
        hourFormat: report.hourFormatSpecimen,
        hoursTotal: "",
        volTotal: "",
        fasting: lab.fasting == 'yes'? 'true': 'false',
        test: {
          disease: "covid",
          specimenSourceSelected: specimenLabel,
          questReq: lab.questReq,
          race: lab.race || '',
          ethnicity: lab.ethnicity || '',
          firstTest: firstTest,
          employedHealthcare: employedHealthcare || '',
          symptomatic: symptomatic || '',
          dateSymptom: report.dateSymptom,
          hospitalized: hospitalized || '',
          icu: icu || '',
          residentCongregate: residentCongregate || '',
          pregnant: pregnant || '',
          serology: lab.serology? 'S': '',
          additionalTest: lab.additionalTest || '',
          totalTest: lab.totalTest || '',
          clinicalInformation: lab.clinicalInformation || '',
          additionalTest: lab.labComment || '',
          clinicalInformation: lab.nurseNote || '',
        },
        patientInfo: {
          lastName: contact.lastName || '',
          middleName: '',
          name: contact.name || '',
          birth:{
              day: report.dobDay,
              month: report.dobMonth,
              year: report.dobYear
          },
          cellPhone: contact.phone || '',
          address: `${contact.address} ${contact.address2}`,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
          insurance: {
            type: contact.primaryInsurance || '',
            patientType: contact.insuranceType || '',
            patientId: contact.policyNumber || '',
            groupNumber: contact.groupNumber || '',
            name: contact.insuranceName || '',
          },
          gender: '',
        },
        icdCode: lab.diagnosis,
      }
    };
  },

  getSelfUrl() {
    const code = shortid.generate();
    const url = `${process.env.ROOT_URL}sr/${code}`;
    return {
      url,
      code,
    };
  },

  overridePlacesInQueue(json) {
    const { queueId, slot, toAdd } = json;
    const queue = QueuesCollection.findOne({ _id: queueId });
    const { allSlots } = queue;
    const newSlots = allSlots.map(function(itemSlot) {
      if (slot.slotIndex == itemSlot.slotIndex) {
        itemSlot.used = itemSlot.used + toAdd;
      }
      return itemSlot;
    });

    const detailAction = `${toAdd}, ${momenttz(slot.from).format('hh:mm A')} - ${momenttz(slot.to).format('hh:mm A')}`;
    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', 'queueEdit', queueId, null,  EXECUTEDACTION['blockSlots'].id, detailAction);

    return QueuesCollection.update({ _id: queueId }, { $set: { allSlots: newSlots } });
  },

  testTimeZone() {
    return moment(new Date()).tz('America/LosAngeles').format('MM/DD/YYYY HH:mm');
  },

  getRoasterData(queueId, timezone) {
    if (!timezone) {
      timezone = 'America/Los_Angeles';
    }

    const queue = QueuesCollection.findOne(queueId);
    const agencyData = AgencyDataCollection.findOne();
    const { general } = agencyData;

    const { items } = queue;
    const activeItems  = items.filter(item => item.status == QUEUE_ITEMS_STATUS.ACTIVE);
    let result = activeItems.map(activeItem => {
      const { itemId, selectedSlot } = activeItem;
      const queueItem = QueueItemsCollection.findOne(itemId);
      const { contacts } = queueItem;
      // solo hay 1 contacto por item
      const contact = QueueContactsCollection.findOne(contacts[0]);
      const hour = `${momenttz(selectedSlot.from).tz(timezone).format('hh:mm A')}`;

      return {
        timestamp: (new Date(selectedSlot.from)).getTime(),
        time: hour,
        client: `${contact.name} ${contact.lastName}`,
        phone: contact.phone || '',
      }
    });

    result = result.sort((a, b) => a.timestamp - b.timestamp);

    const groupedBy = result.reduce((acc, cur) => {
      const items = {
        timestamp: cur.timestamp,
        time: cur.time,
        client: cur.client,
        phone: cur.phone,
      };
      acc[cur.time] ? acc[cur.time]['clients'].push(items) : acc[cur.time] = { time: cur.time, clients: [items] };
      return acc;
    }, {});

    let rows = Object.values(groupedBy);

    rows.map(item => {
      let clientName = item.clients.slice(0);
      clientName.sort(function(a,b) {
        let x = a.client.toLowerCase();
        let y = b.client.toLowerCase();
        return x < y ? -1 : x > y ? 1 : 0;
      });
      item.clients = clientName;
    });

    return {
      agency: general.name,
      queue: queue.name,
      rows,
    }
  },

  copyQueue(queueId, data) {
    const queue = QueuesCollection.findOne(queueId);
    const newQueue = Object.assign({}, queue);
    const timezone = process.env.TZ;

    delete newQueue._id;
    newQueue.name = data.name;

    newQueue.active = true;
    newQueue.eventDate = getDateWithTz(data.eventDate);

    if (queue.enableSchedule) {
      newQueue.selfRegistrationUrl = Meteor.call('getSelfUrl');
    }

    const completedItem = newQueue.items.filter(item => {
      return item.status != QUEUE_ITEMS_STATUS.OUT;
    });

    newQueue.items = completedItem.map(function(item) {
      item.status = QUEUE_ITEMS_STATUS.ACTIVE;
      return item;
    });

    newQueue.items = newQueue.items.map(item => {
      if (item.selectedSlot) {
        item.selectedSlot.from = getTimeWithCurrentDate(newQueue.eventDate, item.selectedSlot.from);
        item.selectedSlot.to = getTimeWithCurrentDate(newQueue.eventDate, item.selectedSlot.to);
      }

      delete item.checkin;
      delete item.checkinDate;
      return item;
    });

    if(newQueue.allSlots){

      newQueue.allSlots = newQueue.allSlots.map(slot => {
        slot.from = getTimeWithCurrentDate(newQueue.eventDate, slot.from);
        slot.to = getTimeWithCurrentDate(newQueue.eventDate, slot.to);
        return slot;
      });
    }

    newQueue.sourceQueueId = queueId;
    const queueIdNew = QueuesCollection.insert(newQueue);

    const detailAction = `Original Queue (${queue.name} - type: ${queue.type})`;
    Meteor.call('createLogActionHistory', 'QueuesCollection',  'queueAdmin', 'queueEdit', queueIdNew, null,  EXECUTEDACTION['queueCopy'].id, detailAction);

    if (data.notify) {
      newQueue.items.forEach(item => {
        const queueItem = QueueItemsCollection.find({_id: item.itemId}).fetch();
        queueItem.forEach(qItem => {
          const contactId = qItem.contacts[0];
          data.contacts.forEach(contact => {
            if (contact._id == contactId) {
              Meteor.call('sendNotificationsNewAppointment', {
                phone: contact.phone,
                name: `${contact.name} ${contact.lastName}`,
                email: contact.email,
                from: item.selectedSlot.from,
                location: newQueue.location || '',
                carrier: contact.carrier || ''
              }, timezone, queueId);
            }
          });
        });
      });
    }
    return queueIdNew;
  },


  getDetailQueue(json) {
    const { queueId, page, sizePerPage, filter } = json;

    const {
      defaultItem,
      bottomEdge,
      topEdge,
      queue,
      contacts,
      allQueueItems,
    } = getDetail(queueId, page, sizePerPage, filter);

    let currentSurveyName = null;
    let currentSurveyId = null;
    let formHistory = null;

    if (queue && queue.survey) {
      const survey = FormSchemesCollection.findOne({ _id: queue.survey});
      formHistory = FormHistoriesCollection.find({ formId: queue.survey }).fetch();
      currentSurveyId = survey ? survey._id : '';
      currentSurveyName = survey ? survey.name : '';
    }

    itemsToPaginate = allQueueItems;

    const allFilterKeys = Object.keys(filter);
    let customKeys = allFilterKeys.filter(key => {
      return key.includes('__');
    });

    //Filtrar por las que tienen valor
    customKeys = customKeys.filter(customKey => {
      return !!filter[customKey];
    });

    const customFilter = {};
    customKeys.forEach(customKey => {
      customFilter[customKey] = filter[customKey];
    });

    /// Si tiene filtro
    if (filter.name || filter.type) {
      const nameToFilter = filter.name.toLowerCase();
      const filteredContacts = contacts.filter(contact => {
        let passedFilter = true;

        //Filtrar por nombre si es necesario
        if (filter.name) {
          const fullname = `${contact.name} ${contact.lastName}`;
          passedFilter = fullname.toLocaleLowerCase().includes(nameToFilter);
        }

        if (filter.type) {
          passedFilter = passedFilter && contact.type == filter.type;
        }

        return passedFilter;
      });
      const filteredContactsIds = filteredContacts.map(contact => contact._id);
      itemsToPaginate = allQueueItems.filter(queueItem => {
        return filteredContactsIds.includes(queueItem.contacts[0]);
      });
    }

    // Paginar
    const itemsToInclude = itemsToPaginate.slice(bottomEdge, topEdge);

    const sDQueue = QueuesCollection.findOne({ parentQueueId: queue._id });

    let sDIds = [];

    if (sDQueue && sDQueue.items) {
      sDIds = sDQueue.items.map( item => item.itemId );
    }
    const sDQueueItems = QueueItemsCollection.find({ _id: { $in: sDIds } }).fetch();

    let tableItems = itemsToInclude.map((queueItem, index) => {
      const item = queue.items.find(tempItem => tempItem.itemId == queueItem._id);
      const mainContactId = queueItem.contacts[0];
      const mainContact = contacts.find(contact => contact._id === mainContactId);
      if (!mainContact) return defaultItem;

      let sDQueueItemsEventDate = null;
      if(sDQueueItems){
        sDQueueItem = sDQueueItems.find(queueItem => queueItem.contacts && queueItem.contacts.length > 0 && queueItem.contacts[0] == mainContactId);

        if(sDQueueItem){
          slot = sDQueue.items.find(slot => slot.itemId == sDQueueItem._id);
          sDQueueItemsEventDate = `${moment(slot.selectedSlot.from).format('MM/DD/YYYY')} ${moment(slot.selectedSlot.from).format('hh:mm A')}  ${moment(slot.selectedSlot.to).format('hh:mm A')}`;
        }
      }
      return {
        _id: queueItem._id,
        number: index + 1,
        contactName: `${mainContact.name} ${mainContact.lastName}_${mainContact.zip ? mainContact.zip : 0}_${mainContact.dob}`,
        contactEmail: mainContact.email,
        contactPhone: mainContact.phone,
        car: queueItem.car,
        note: queueItem.note,
        arrivalTime: queueItem.date,
        contacts: queueItem.contacts.length,
        status: item.status,
        itemId: item.itemId,
        allContactNames: queueItem.contacts.map(contactId => {
          const contact = contacts.find(contact => contact._id === contactId);
          if (!contact) return '---';
          return `${contact.name} ${contact.lastName}`;
        }),
        appoiment: item.selectedSlot,
        type: queue.type || 'lab',
        checkin: item.checkin || null,
        checkinDate: item.checkinDate || null,
        notifyHistory: item.notifyHistory,
        mainContactId,
        sDQueueItemsEventDate,
        carrier: mainContact.carrier,
        surveyName: currentSurveyName,
        surveyId: currentSurveyId,
        surveyCreated: (formHistory && formHistory.some(obj => obj.personId == mainContactId)),
      }
    });

    // sort
    let sortObject = { field: 'appoiment', order: 'asc'};
    if (json.sortObject && json.sortObject.field) {
      sortObject = json.sortObject;
    }

    if (json.sortObject.field == 'appoiment') {
        tableItems.sort((a, b) => {
        if (json.sortObject.order == 'asc') {
          return new Date(b.appoiment.from) - new Date(a.appoiment.from);
        } else {
          return new Date(a.appoiment.from) - new Date(b.appoiment.from);
        }
      })
    }

    return {
      totalItems: itemsToPaginate.length,
      tableItems,
      sDQueue,
    }
  },

  getDetailQueueLab(json) {
    const { queueId, filter } = json;
    const {
      defaultItem,
      bottomEdge,
      topEdge,
      queue,
      contacts,
      allQueueItems,
    } = getDetail(queueId, page = null, sizePerPage = null, filter);

    const itemsToInclude = allQueueItems;

    let tableItems = itemsToInclude.map((queueItem, index) => {
      const item = queue.items.find(tempItem => tempItem.itemId == queueItem._id);
      const mainContactId = queueItem.contacts[0];
      const mainContact = contacts.find(contact => contact._id === mainContactId);
      if (!mainContact) return defaultItem;

      return {
        _id: queueItem._id,
        number: index + 1,
        contactName: `${mainContact.name} ${mainContact.lastName}`,
        car: queueItem.car,
        note: queueItem.note,
        arrivalTime: queueItem.date,
        contacts: queueItem.contacts.length,
        status: item.status,
        allContactNames: queueItem.contacts.map(contactId => {
          const contact = contacts.find(contact => contact._id === contactId);
          if (!contact) return '---';
          return `${contact.name} ${contact.lastName}`;
        }),
        type: queue.type || 'lab',
      }
    });

    return {
      totalItems: itemsToInclude.length,
      tableItems,
    }
  },

  notifySingleQueueContact(queueId, pendingList, queueUrl) {
    const queue = QueuesCollection.findOne({ _id: queueId });

    const data = {
      url: queueUrl,
      agencyName: `${Meteor.call('getTitleFromType', 'notifyNewAppoiment')}`,
      agency: `${Meteor.call('getTitleFromType', 'notifyNewAppoiment')}`,
      subject: `${Meteor.call('getTitleFromType', 'notifyNewAppoiment')}`,
    };

    const newItems = queue.items.map(item => {

      const result = pendingList && pendingList.find(x=> x == item.itemId);

      if (result) {
        const notifyHistory = item.notifyHistory || [];
        notifyHistory.push(new Date());
        item.notifyHistory = notifyHistory;
        Meteor.call('notifyNewPlaceAvailableQueue', item.itemId, data);
      }

      return item;
    });

    return QueuesCollection.update({ _id: queueId }, { $set: { items: newItems } });
  },

  notifyNewPlaceAvailableQueue(queueItemId, data) {
    const queueListItem = QueueItemsCollection.findOne(queueItemId);
    const contactId = queueListItem.contacts[0];
    const contact = QueueContactsCollection.findOne(contactId);
    data.name = `${contact.name} ${contact.lastName}`;
    data.url = `${data.url}?queueContactId=${contactId}`;
    data.carrier = contact.carrier;

    if (contact.email) {
      Meteor.call('notifySlotsAvailable', contact.email, data);
    }

    if (contact.phone) {
      Meteor.call('sendNotifySlotsAvailable', contact.phone, data);
    }

  },

  updateQueueContactInfo(contactDataId, contactData) {
    Meteor.call('updateContactsDemographics', contactDataId, contactData.contactInfo);

    if (contactData.customSurvey && contactData.customSurvey.formId) {
      const toSend = {
        formId: contactData.customSurvey.formId,
        personId: contactDataId,
        data: contactData.customSurvey.data,
      };

      Meteor.call('newFormHistory', toSend);
    }
  },

  updateContactsDemographics(contactDataId, contactData) {
    const updateDemographics = {
      address: contactData.address,
      address2: contactData.address2,
      zip: contactData.zip,
      state: contactData.state,
      city: contactData.city,
    };
    const findQuery = { _id: contactDataId };
    const queueContacts = QueueContactsCollection.findOne(findQuery);
    const newQueue = Object.assign(queueContacts, updateDemographics);
    QueueContactsCollection.update(findQuery, { $set: newQueue });
  },

  getQueueNameSource(queueId) {
    const queue = QueuesCollection.findOne(queueId);
    const queueSourceId = queue && queue._id ? queue._id : null;
    const queueSourceName = queue && queue.name ? queue.name : null;
    return {
      queueId: queueSourceId,
      name: queueSourceName,
    }
  },

  // aJiG6YmaZHrurNDx6
  fixQueueNoSlots(queueId) {
    const queue = QueuesCollection.findOne(queueId);
    const { scheduleData, items } = queue;
    
    const allSlots = [];
    let slotIndex = 0;

    const frecuency = Number(scheduleData.frecuency);
    const { begin, end } = scheduleData;

    const startDate = moment(queue.eventDate);
    startDate.hour(begin.getHours());
    startDate.minute(begin.getMinutes());
    startDate.second(0);

    const finishDate = moment(queue.eventDate);
    finishDate.hour(end.getHours());
    finishDate.minute(end.getMinutes());
    finishDate.second(0);

    let iterateDate = moment(startDate);

    while(iterateDate < finishDate) {
      const item = {
        from: iterateDate.toDate(),
      };
      iterateDate.add(frecuency, 'm');
      item.to = iterateDate.toDate();
      item.total = Number(scheduleData.slots);

      // used items
      const usedItemsInThisSlot = items.filter(temp => {
        return temp.selectedSlot.slotIndex == slotIndex;
      });
      console.log('Items used => ', usedItemsInThisSlot.length);

      item.used = usedItemsInThisSlot.length;
      item.slotIndex = slotIndex;
      allSlots.push(item);

      slotIndex++;
    }
    
    console.log('All slots => ', allSlots);
    return QueuesCollection.update({ _id: queueId }, { $set: { allSlots } });
  }

});

const convertDataIntoPerson = function(contact, index) {
  const username = `tempID_${Date.now()}${index}`;
  const profile = {
    name: contact.name,
    lastName: contact.lastName,
    middleName: '',
    patientId: username,
    otherId: '',
    provider: '',
    gender: '',
    homePhone: '',
    workPhone: '',
    birth: contact.dob || null,
    diseases: [],
    selfTracking: '',
    address: contact.address,
    cellPhone: '',
    zipCode: '',
    facility: '',
    initialContact: contact.dateOfContact,
    contacts: [ ],
    active: true,
    death: null,
  };

  const userId = Meteor.call('newContact', {
    general: profile,
    others: {},
  });
  return userId;
};

// Queue items
const convertContactToRow = function(contact, status, queueNumber) {

  let statusLabel = 'In the line';
  switch(status) {
    case QUEUE_ITEMS_STATUS.OUT:
      statusLabel = 'Cancel / No Show';
      break;
    case QUEUE_ITEMS_STATUS.ACTIVE:
      statusLabel = 'In the line';
      break;
    case QUEUE_ITEMS_STATUS.COMPLETED:
      statusLabel = 'Completed';
      break;
  }

  const today = (new Date()).getFullYear();
  let age = 0;
  age = contact.dob ? today - contact.dob.getFullYear() : '--';

  return [
    `${queueNumber + 1}`,
      contact.name,
      contact.lastName,
      age,
      contact.status,
      contact.address,
      contact.address2,
      contact.state,
      contact.city,
      contact.zip,
      contact.phone,
      contact.note,
      contact.dob ? moment(contact.dob).format('MMM/DD/YYYY'): '',
      statusLabel,
  ];
};

const getQueueItemsLabels = function(type) {
  if (type == 'lab') {
    return [
      'Queue number', 'Name', 'Last name', 'Age', 'Status', 'Address 1', 'Address 2',
      'State', 'City', 'ZIP', 'Phone', 'Nurse note', 'DOB', 'Queue status', 'Arrival time'
    ];
  }

  if (type == 'immunization') {
    return [
      'Queue number', 'Name', 'Last name', 'Age', 'Status', 'Address 1', 'Address 2',
      'State', 'City', 'ZIP', 'Phone', 'Nurse note', 'DOB', 'Queue status', 'Appoitment', 'Check in'
    ];
  }

  return [
    'Queue number', 'Name', 'Last name', 'Age', 'Status', 'Address 1', 'Address 2',
    'State', 'City', 'ZIP', 'Phone', 'Nurse note', 'DOB', 'Queue status', 'Arrival time', 'Appoitment', 'Check in'
  ];
};
