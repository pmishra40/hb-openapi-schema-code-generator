from typing import Dict, Any, Callable, List
import boto3
from models.bill_event import BillEvent

class BillEventConsumer:
    def __init__(self, region: str = 'us-west-2', event_bus_name: str = 'homebound-events'):
        """Initialize the BillEvent event consumer.

        Args:
            region (str): AWS region for EventBridge. Defaults to 'us-west-2'.
            event_bus_name (str): EventBridge event bus name. Defaults to 'homebound-events'.
        """
        self.event_bus_name = event_bus_name
        self.client = boto3.client('events', region_name=region)
        self.handlers: List[Callable[[BillEvent], None]] = []

    def on(self, handler: Callable[[BillEvent], None]) -> None:
        """Register a handler for BillEvent events.

        Args:
            handler (Callable[[BillEvent], None]): Function to handle the event.

        Example:
            ```python
            consumer = BillEventConsumer()
            
            @consumer.on
            def handle_event(event: BillEvent) -> None:
                print(f"Received event: {event}")
            ```
        """
        self.handlers.append(handler)

    def handle_event(self, event_data: Dict[str, Any]) -> None:
        """Handle an incoming event.

        Args:
            event_data (Dict[str, Any]): Raw event data from EventBridge.
        """
        try:
            # Parse event data into model
            event = BillEvent.from_dict(event_data['detail'])
            
            # Call all registered handlers
            for handler in self.handlers:
                handler(event)
        except Exception as e:
            # Log error and continue
            print(f"Error handling event: {str(e)}")

    def start(self) -> None:
        """Start listening for events.

        This method sets up the necessary EventBridge rules and targets
        to receive events. It's a placeholder for now - in a real implementation,
        you would typically use AWS Lambda or another compute service to receive events.
        """
        # TODO: Implement event listening logic
        # This would typically involve:
        # 1. Creating an EventBridge rule
        # 2. Setting up a target (Lambda, SQS, etc.)
        # 3. Starting the event processing
        pass
