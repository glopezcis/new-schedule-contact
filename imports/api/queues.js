import { Mongo } from 'meteor/mongo';

const QueuesCollection = new Mongo.Collection('queues');
QueuesCollection.attachBehaviour('timestampable');

export {
  QueuesCollection
};

