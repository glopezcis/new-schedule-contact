import { QueueItemsCollection } from '/imports/api/queueItems';
import { QueuesCollection } from '/imports/api/queues';

Meteor.publish({

  queueItemsByQueue(queueId) {
    const queue = QueuesCollection.findOne(queueId);
    let ids = [];
    if (queue && queue.items) {
      ids = queue.items.map( item => item.itemId );
    }
    return QueueItemsCollection.find({ _id: { $in: ids } });
  },

  queueItemsByQueueParentId(queueId) {
    const queue = QueuesCollection.findOne({parentQueueId: queueId});
    let ids = [];
    if (queue && queue.items) {
      ids = queue.items.map( item => item.itemId );
    }
    return QueueItemsCollection.find({ _id: { $in: ids } });
  },

  queueItemsById(queueItemId) {
    return QueueItemsCollection.find({ _id: queueItemId });
  },

});
