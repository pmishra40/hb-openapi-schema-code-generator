from typing import Dict, Any
import boto3
import json
from datetime import date, datetime
from ..models.bill_event import BillEvent

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)

class BillEventPublisher:
    def __init__(self, region: str = 'us-west-2', event_bus_name: str = 'homebound-events', source: str = 'com.homebound'):
        """Initialize the BillEvent event publisher.

        Args:
            region (str): AWS region for EventBridge. Defaults to 'us-west-2'.
            event_bus_name (str): EventBridge event bus name. Defaults to 'homebound-events'.
            source (str): Source identifier for events. Defaults to 'com.homebound'.
        """
        self.event_bus_name = event_bus_name
        self.source = source
        self.client = boto3.client('events', region_name=region)

    def publish(self, event: BillEvent) -> Dict[str, Any]:
        """Publish a BillEvent event to EventBridge.

        Args:
            event (BillEvent): The event to publish.

        Returns:
            Dict[str, Any]: Response from EventBridge PutEvents API.

        Example:
            ```python
            publisher = BillEventPublisher()
            event = BillEvent(id='123', data='test')
            response = publisher.publish(event)
            ```
        """
        event_entry = {
            'Source': self.source,
            'DetailType': 'BillEvent',
            'Detail': json.dumps(event.model_dump(by_alias=True), cls=DateTimeEncoder),
            'EventBusName': self.event_bus_name
        }

        response = self.client.put_events(Entries=[event_entry])
        return response
