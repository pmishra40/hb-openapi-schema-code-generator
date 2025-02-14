#!/usr/bin/env python3

import json
import os
from pathlib import Path
from dotenv import load_dotenv
import sys

# Add the generated code directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent / 'generated' / 'python'))

from Bills.models.bill import Bill
from Bills.models.bill_event import BillEvent
from Bills.models.project import Project
from Bills.models.line_item import LineItem
from Bills.models.approval import Approval
from Bills.models.metadata import Metadata
from Bills.events.bill_event_publisher import BillEventPublisher

# Add __init__.py files to make the modules importable
Path(Path(__file__).parent.parent.parent / 'generated' / 'python' / 'Bills' / 'models' / '__init__.py').touch()
Path(Path(__file__).parent.parent.parent / 'generated' / 'python' / 'Bills' / '__init__.py').touch()

# Load environment variables
load_dotenv()

# Define event types
BILL_EVENT_TYPES = {
    'APPROVED': 'BillApproved'
}

def main():
    try:
        # Load and validate JSON file
        event_file_path = Path(__file__).parent / 'billApprovedEvent.json'
        try:
            with open(event_file_path, 'r') as f:
                event_data = json.load(f)
        except Exception as e:
            print(f"Error reading JSON file: {e}")
            return

        # Create event publisher
        publisher = BillEventPublisher(
            region=os.getenv('AWS_REGION', 'us-west-2'),
            event_bus_name=os.getenv('EVENT_BUS_NAME', 'homebound-events'),
            source=os.getenv('EVENT_SOURCE', 'com.homebound')
        )

        # Convert dict to model objects
        bill = Bill(**event_data['bill'])
        project = Project(**event_data['project'])
        line_items = [LineItem(**item) for item in event_data['lineItems']]
        approval = Approval(**event_data['approval'])
        event_metadata = Metadata(**event_data['eventMetadata'])

        # Create and publish event
        event = BillEvent(
            bill=bill,
            project=project,
            lineItems=line_items,
            approval=approval,
            eventMetadata=event_metadata
        )
        response = publisher.publish(event)

        print(f"Successfully published event: {response}")

    except Exception as e:
        print(f"Error publishing event: {e}")

if __name__ == "__main__":
    main()
