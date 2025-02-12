import { EventBridge } from '@aws-sdk/client-eventbridge';
import { GlJournalEventPublisher } from '../../generated/typescript/Journals/events/GlJournalEvent.publisher';
import { ObjectSerializer } from '../../generated/typescript/Journals/models/ObjectSerializer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { fromSSO } from '@aws-sdk/credential-providers';

// Load environment variables
config();

async function main() {
    // Create EventBridge client with SSO credentials
    const eventBridge = new EventBridge({
        region: process.env.AWS_REGION || 'us-west-2',
        credentials: fromSSO({ profile: process.env.AWS_PROFILE })
    });

    // Load event data from JSON file
    const eventData = JSON.parse(
        readFileSync(join(__dirname, 'journalEvent.json'), 'utf-8')
    );

    // Properly deserialize the event data
    const journalEvent = ObjectSerializer.deserialize(eventData, 'GlJournalEvent', 'application/json');

    // Create publisher
    const publisher = new GlJournalEventPublisher(
        eventBridge, 
        process.env.EVENT_BUS_NAME || 'homebound-events'
    );

    // Publish event
    const response = await publisher.publish(
        journalEvent, 
        process.env.EVENT_SOURCE || 'com.homebound.bills'
    );
    console.log('Event published successfully');
    console.log('Event ID:', response.Entries?.[0]?.EventId);
}

main().catch(console.error);