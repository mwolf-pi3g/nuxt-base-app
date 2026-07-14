
export default defineEventHandler(async (event) => {
  // If this were real data, we would use a service layer. 
  // See services/app/*.ts

  return {
    data: [
      {
        id: 1,
        name: 'fake_data_1',
        value: 'value_1'
      },
      {
        id: 2,
        name: 'fake_data_2',
        value: 'value_2'
      },
      {
        id: 3,
        name: 'fake_data_3',
        value: 'value_3'
      }
    ],
    statusMessage: 'success fake_data.read.success',
  };
});
