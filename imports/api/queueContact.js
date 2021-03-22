import { Mongo } from 'meteor/mongo';

const QueueContactsCollection = new Mongo.Collection('queueContacts');
QueueContactsCollection.attachBehaviour('timestampable');

export {
  QueueContactsCollection
};

