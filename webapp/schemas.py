from functools import wraps

from pydantic import BaseModel


def validate_input(model):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create a pydantic basemodel instance with provided kwargs
            # Throws a ValidationError if the input data is invalid
            model(**kwargs)
            # Call the original function with validated inputs
            return func(*args, **kwargs)

        return wrapper

    return decorator


class ChangesRequestModel(BaseModel):
    due_date: str
    reporter_id: int
    webpage_id: int
    type: int
    description: str


changes = {
    "due_date": "2022-01-01",
    "reporter_id": 1,
    "webpage_id": 1,
    "type": 0,
    "description": "This is a description",
}