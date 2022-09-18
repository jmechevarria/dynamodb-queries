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
    threw = false;
  });

  afterEach(() => {
    sinon.reset();
  });

  after(() => {
    sinon.restore();
  });

  it('Returns all contacts for that user email up to limit', async () => {
    const event = {
      userEmail: 'user@email.com', limit: 2,
    };
    queryStub.resolves(dbResponses.firstTwo);
    const result = await app.lambdaHandler(event);

    expect(result).eql({
      contacts: dbResponses.firstTwo.Items,
      offset: 'eyJ1c2VyX2VtYWlsIjoidXNlckBlbWFpbC5jb20iLCJjb21wb3NpdGVfbmFtZV9waG9uZSI6IlVzZXIgbmFtZSAyOjo1NTUxMTExIn0=',
    });
  });

  it('Returns up to 100 contacts for that user email if no limit is supplied or is over 100', async () => {
    // no limit
    const event = { userEmail: 'user@email.com' };

    const oneHundred = JSON.parse(JSON.stringify(dbResponses.fourContacts));
    oneHundred.Items = new Array(25).fill(dbResponses.fourContacts.Items).flat();

    queryStub.resolves(oneHundred);

    let result = await app.lambdaHandler(event);

    expect(queryStub.calledOnce).eq(true);

    expect(result).eql({
      contacts: oneHundred.Items,
      offset: 'eyJ1c2VyX2VtYWlsIjoidXNlckBlbWFpbC5jb20iLCJjb21wb3NpdGVfbmFtZV9waG9uZSI6IlVzZXIgbmFtZSA0Ojo1NTUyMjIyIn0=',
    });

    // limit over 100
    event.limit = 101;
    queryStub.reset();
    queryStub.resolves(oneHundred);
    result = await app.lambdaHandler(event);

    expect(queryStub.calledOnce).eq(true);
    expect(result.contacts).eql(oneHundred.Items);

    expect(result.offset).eq('eyJ1c2VyX2VtYWlsIjoidXNlckBlbWFpbC5jb20iLCJjb21wb3NpdGVfbmFtZV9waG9uZSI6IlVzZXIgbmFtZSA0Ojo1NTUyMjIyIn0=');
    expect(result).eql({
      contacts: oneHundred.Items,
      offset: 'eyJ1c2VyX2VtYWlsIjoidXNlckBlbWFpbC5jb20iLCJjb21wb3NpdGVfbmFtZV9waG9uZSI6IlVzZXIgbmFtZSA0Ojo1NTUyMjIyIn0=',
    });
  });

  it('Sets LastEvaluatedKey to undefined if provided offset does not have the expected structure', async () => {
    const event = { userEmail: 'user@email.com', offset: 'eyJ1c2VyX2VtYWlsIjoidXNlckBlbWFpbC5jb20iLCJxY29tcG9zaXRlX25hbWVfcGhvbmUiOiJVc2VyIG5hbWUgMjo6NTU1MTExMSJ9' };

    queryStub.resolves(dbResponses.fourContacts);

    await app.lambdaHandler(event);

    expect(console.error.notCalled).eq(true);
    expect(queryStub.getCall(0).args[0].input.ExclusiveStartKey).eq(undefined);
  });

  it('Throws 400 if there is an error fetching contacts', async () => {
    queryStub.resolves({ $metadata: { httpStatusCode: 400 } });

    try {
      await app.lambdaHandler({ name: 'name', phone: 'phone', addressLines: [] });
    } catch (error) {
      expect(console.error.callCount).eq(3);
      expect(error.message).eq('400');
      threw = true;
    }

    expect(threw).eq(true);
  });

  it('Throws 500 if there is an unexpected error', async () => {
    queryStub.rejects();

    const userEmail = 'user@email.com';
    try {
      await app.lambdaHandler({
        userEmail, name: 'name', phone: 'phone', addressLines: [],
      });
    } catch (error) {
      expect(console.error.callCount).eq(3);
      expect(console.error.getCall(1).args[0]).eq(`Getting contacts for ${userEmail}`);
      threw = true;
    }

    expect(threw).eq(true);
  });
});
