import { Client, Account } from 'appwrite';

const client = new Client();

client
  .setEndpoint('https://cloud.appwrite.io/v1') // Replace with your Appwrite endpoint
  .setProject('67e1aa990024ee9006ed'); // Replace with your Project ID

export const account = new Account(client);