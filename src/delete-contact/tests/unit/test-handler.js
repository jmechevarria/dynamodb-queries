const sinon = require('sinon');
const { expect } = require('chai');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

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
      expect(console.error.getCall(0).args[0]).eq('Deleting contact');
      expect(error.message).eq('500');
      threw = true;
    }

    expect(threw).eq(true);
  });

  it('Returns true if contact is deleted successfully', async () => {
    queryStub.resolves({ $metadata: { httpStatusCode: 200 }, Attributes: {} });
    const event = { userEmail: 'user@email.com', name: 'name', phone: 'phone' };
    const result = await app.lambdaHandler(event);

    expect(console.log.callCount).eq(2);
    expect(console.log.getCall(1).args[0]).eq(`Deleted contact ${event.name} with phone ${event.phone}`);
    expect(result).eq(true);
  });

  it('Throws 404 no contact is found with that name and phone', async () => {
    queryStub.resolves({ $metadata: { httpStatusCode: 200 } });

    try {
      await app.lambdaHandler({ name: 'name', phone: 'phone', addressLines: [] });
    } catch (error) {
      expect(console.error.callCount).eq(1);
      expect(error.message).eq('404');
      threw = true;
    }

    expect(threw).eq(true);
  });
});
