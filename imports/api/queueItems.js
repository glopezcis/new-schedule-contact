import { Mongo } from 'meteor/mongo';

const QueueItemsCollection = new Mongo.Collection('queueItems');
QueueItemsCollection.attachBehaviour('timestampable');

export {
  QueueItemsCollection
};

