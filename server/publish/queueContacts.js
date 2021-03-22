import { QueueItemsCollection } from '/imports/api/queueItems';
import { QueuesCollection } from '/imports/api/queues';
import { QueueContactsCollection } from '/imports/api/queueContact';

import flatten from 'lodash.flattendeep';

Meteor.publish({

  contactsByQueue(queueId) {
    const queue = QueuesCollection.findOne(queueId);
    let ids = [];
    if (queue && queue.items) {
      ids = queue.items.map( item => item.itemId );
    }
    
    const items = QueueItemsCollection.find({ _id: { $in: ids } }).fetch();
    let contactIds = [];
    contactIds = items.map(item => {
      return item.contacts;
    });
    contactIds = flatten(contactIds);
    return QueueContactsCollection.find({ _id: { $in: contactIds } });
  },

  contactsByQueueItemId(queueItemId) {
    const item = QueueItemsCollection.findOne({ _id: queueItemId });
    return QueueContactsCollection.find({ _id: { $in: item.contacts } });
  },

  contactsQueueById(contactId) {
    return QueueContactsCollection.find({ _id: contactId });
  },

});
