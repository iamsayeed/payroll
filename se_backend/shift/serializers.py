from rest_framework import serializers
from .models import Shift
from datetime import datetime, timedelta

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'
        read_only_fields = ['expected_hours']  # Make expected_hours read-only

    def validate(self, data):
        """Automatically calculate expected_hours as (shift_end - shift_start) - 1 hour break."""
        shift_start = data.get('shift_start')
        shift_end = data.get('shift_end')

        if shift_start and shift_end:
            # Convert to datetime to compute difference
            start_time = datetime.combine(datetime.today(), shift_start)
            end_time = datetime.combine(datetime.today(), shift_end)

            if end_time <= start_time:
                raise serializers.ValidationError("Shift end time must be after shift start time.")

            # Compute hours and subtract 1 hour for break
            expected_hours = (end_time - start_time).total_seconds() / 3600 - 1
            data['expected_hours'] = max(expected_hours, 0)  # Ensure it's not negative

        return data
