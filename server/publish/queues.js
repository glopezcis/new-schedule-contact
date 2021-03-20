import { QueuesCollection } from '/imports/api/queues';
import { QueueContactsCollection } from '/imports/api/queueContact';
import { QueueItemsCollection } from '/imports/api/queueItems';

Meteor.publish({

  allQueues() {
    return QueuesCollection.find({ enabled: true});
  },

  activeQueues() {
    return QueuesCollection.find({ active: true });
  },

  queueById(queueId) {
    return QueuesCollection.find({ _id: queueId });
  },

  queueByPublicCode(publicCode) {
    return QueuesCollection.find({ 'selfRegistrationUrl.code': publicCode });
  },

  queueByParentQueueId(queueId) {
    return QueuesCollection.find({ parentQueueId: queueId });
  },

  allQueueContacts() {
    return QueueContactsCollection.find();
  },
  
  allQueueItems() {
    return QueueItemsCollection.find();
  },

});
