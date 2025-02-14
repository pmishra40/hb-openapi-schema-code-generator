# coding: utf-8

"""
    Bill Events API

    API for bill-related events, including project, line items, approval, and metadata.

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


from __future__ import annotations
import pprint
import re  # noqa: F401
import json

from pydantic import BaseModel, ConfigDict, Field
from typing import Any, ClassVar, Dict, List
from ..models.approval import Approval
from ..models.bill import Bill
from ..models.line_item import LineItem
from ..models.metadata import Metadata
from ..models.project import Project
from typing import Optional, Set
from typing_extensions import Self

class BillEvent(BaseModel):
    """
    BillEvent
    """ # noqa: E501
    bill: Bill
    project: Project
    line_items: List[LineItem] = Field(alias="lineItems")
    approval: Approval
    event_metadata: Metadata = Field(alias="eventMetadata")
    __properties: ClassVar[List[str]] = ["bill", "project", "lineItems", "approval", "eventMetadata"]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
    )


    def to_str(self) -> str:
        """Returns the string representation of the model using alias"""
        return pprint.pformat(self.model_dump(by_alias=True))

    def to_json(self) -> str:
        """Returns the JSON representation of the model using alias"""
        # TODO: pydantic v2: use .model_dump_json(by_alias=True, exclude_unset=True) instead
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        """Create an instance of BillEvent from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        """
        excluded_fields: Set[str] = set([
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        # override the default output from pydantic by calling `to_dict()` of bill
        if self.bill:
            _dict['bill'] = self.bill.to_dict()
        # override the default output from pydantic by calling `to_dict()` of project
        if self.project:
            _dict['project'] = self.project.to_dict()
        # override the default output from pydantic by calling `to_dict()` of each item in line_items (list)
        _items = []
        if self.line_items:
            for _item_line_items in self.line_items:
                if _item_line_items:
                    _items.append(_item_line_items.to_dict())
            _dict['lineItems'] = _items
        # override the default output from pydantic by calling `to_dict()` of approval
        if self.approval:
            _dict['approval'] = self.approval.to_dict()
        # override the default output from pydantic by calling `to_dict()` of event_metadata
        if self.event_metadata:
            _dict['eventMetadata'] = self.event_metadata.to_dict()
        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of BillEvent from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "bill": Bill.from_dict(obj["bill"]) if obj.get("bill") is not None else None,
            "project": Project.from_dict(obj["project"]) if obj.get("project") is not None else None,
            "lineItems": [LineItem.from_dict(_item) for _item in obj["lineItems"]] if obj.get("lineItems") is not None else None,
            "approval": Approval.from_dict(obj["approval"]) if obj.get("approval") is not None else None,
            "eventMetadata": Metadata.from_dict(obj["eventMetadata"]) if obj.get("eventMetadata") is not None else None
        })
        return _obj


