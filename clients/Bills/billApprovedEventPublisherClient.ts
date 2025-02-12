import { BillEventPublisher } from '../../generated/typescript/Bills/events/BillEvent.publisher';
import { ObjectSerializer } from '../../generated/typescript/Bills/models/ObjectSerializer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Define event types
const BILL_EVENT_TYPES = {
    APPROVED: 'BillApproved',
    // Add other event types as needed
} as const;

async function main() {
    try {
        // Load and validate JSON file
        let eventData: unknown;
        try {
            const rawData = readFileSync(join(__dirname, 'billApprovedEvent.json'), 'utf-8');
            eventData = JSON.parse(rawData);
        } catch (error) {
            if (error instanceof Error) {
                if (error instanceof SyntaxError) {
                    throw new Error('Invalid JSON format in billApprovedEvent.json. Please ensure it contains valid JSON data.');
                }
                throw new Error(`Failed to read event data: ${error.message}`);
            }
            throw error;
        }

        // Deserialize and validate against schema
        let billEvent;
        try {
            billEvent = ObjectSerializer.deserialize(eventData, 'BillEvent', 'application/json');
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Invalid event data format: ${error.message}. Please ensure all fields match the expected types.`);
            }
            throw error;
        }

        // Create publisher with all required configuration
        const publisher = new BillEventPublisher({
            region: process.env.AWS_REGION || 'us-west-2',
            profile: process.env.AWS_PROFILE,
            eventBusName: process.env.EVENT_BUS_NAME || 'homebound-events',
            source: process.env.EVENT_SOURCE || 'com.homebound.bills'
        });

        // Publish event
        const response = await publisher.publish(
            billEvent,
            BILL_EVENT_TYPES.APPROVED
        );
        
        console.log('Event published successfully');
        console.log('Event ID:', response.Entries?.[0]?.EventId);
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Error:', error instanceof Error ? error.message : 'An unknown error occurred');
        process.exit(1);
    }
}

main().catch(console.error);