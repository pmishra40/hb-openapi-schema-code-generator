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

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr
from typing import Any, ClassVar, Dict, List, Optional
from typing import Optional, Set
from typing_extensions import Self

class LineItem(BaseModel):
    """
    LineItem
    """ # noqa: E501
    line_id: StrictStr = Field(alias="lineId")
    amount_in_cents: StrictInt = Field(alias="amountInCents")
    paid_in_cents: Optional[StrictInt] = Field(default=None, alias="paidInCents")
    cost_code_id: StrictStr = Field(alias="costCodeId")
    cost_code_number: StrictStr = Field(alias="costCodeNumber")
    cost_classification: StrictStr = Field(alias="costClassification")
    cost_division: Optional[StrictStr] = Field(default=None, alias="costDivision")
    cost_code_version: Optional[StrictInt] = Field(default=None, alias="costCodeVersion")
    source_id: Optional[StrictStr] = Field(default=None, alias="sourceId")
    description: Optional[StrictStr] = None
    __properties: ClassVar[List[str]] = ["lineId", "amountInCents", "paidInCents", "costCodeId", "costCodeNumber", "costClassification", "costDivision", "costCodeVersion", "sourceId", "description"]

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
        """Create an instance of LineItem from a JSON string"""
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
        # set to None if cost_division (nullable) is None
        # and model_fields_set contains the field
        if self.cost_division is None and "cost_division" in self.model_fields_set:
            _dict['costDivision'] = None

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of LineItem from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "lineId": obj.get("lineId"),
            "amountInCents": obj.get("amountInCents"),
            "paidInCents": obj.get("paidInCents"),
            "costCodeId": obj.get("costCodeId"),
            "costCodeNumber": obj.get("costCodeNumber"),
            "costClassification": obj.get("costClassification"),
            "costDivision": obj.get("costDivision"),
            "costCodeVersion": obj.get("costCodeVersion"),
            "sourceId": obj.get("sourceId"),
            "description": obj.get("description")
        })
        return _obj


