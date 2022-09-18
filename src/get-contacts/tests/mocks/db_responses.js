exports.firstTwo = {
  $metadata: { httpStatusCode: 200 },
  Items: [
    {
      name: 'User name',
      phone: '5550000',
      address_lines: "Don't cross::this line",
    },
    {
      name: 'User name 2',
      phone: '5551111',
      address_lines: "Don't cross::this line",
    },
  ],
  LastEvaluatedKey: {
    user_email: 'user@email.com',
    composite_name_phone: 'User name 2::5551111',
  },
};

exports.fourContacts = {
  $metadata: { httpStatusCode: 200 },
  Items: [
    {
      name: 'User name',
      phone: '5550000',
      address_lines: "Don't cross::this line",
    },
    {
      name: 'User name 2',
      phone: '5551111',
      address_lines: 'But may::cross this one',
    },
    {
      name: 'User name 3',
      phone: '5552222',
      address_lines: 'But may::cross this one',
    },
    {
      name: 'User name 4',
      phone: '5552222',
      address_lines: 'But may::cross this one',
    },
  ],
};
