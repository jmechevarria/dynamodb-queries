const sinon = require('sinon');
const { expect } = require('chai');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dbResponses = require('../mocks/db_responses');

const app = require('../../app');

describe('Tests app.js', () => {
  let threw;
  let queryStub;

  before(() => {
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');

    queryStub = sinon.stub(DynamoDBClient.prototype, 'send');
  });

  beforeEach(() => {
    queryStub.resolves(dbResponses.ok);
    threw = false;
  });

  afterEach(() => {
    sinon.reset();
  });

  after(() => {
    sinon.restore();
  });

  it('Throws 500 if there is an unexpected error', async () => {
    queryStub.rejects();

    try {
      await app.lambdaHandler({ name: 'name', phone: 'phone', addressLines: [] });
    } catch (error) {
      expect(console.error.callCount).eq(1);
      expect(console.error.getCall(0).args[0]).eq('Creating contact');
      threw = true;
    }

    expect(threw).eq(true);
  });

  it('Returns contact if one is created', async () => {
    const event = { name: 'name', phone: 'phone', addressLines: [] };
    const result = await app.lambdaHandler(event);
    expect(result).eql({
      contact: {
        addressLines: event.addressLines,
        name: event.name,
        phone: event.phone,
      },
    });
  });

  it('Throws 409 if user already has a contact with that name and phone', async () => {
    queryStub.rejects({ name: 'ConditionalCheckFailedException' });

    try {
      await app.lambdaHandler({ name: 'name', phone: 'phone' });
    } catch (error) {
      expect(console.error.callCount).eq(1);
      expect(error.message).eq('409:Contact already registered');
      threw = true;
    }

    expect(threw).eq(true);
  });
});
