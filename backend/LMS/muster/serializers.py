from rest_framework import serializers
from labs.models import Lab, PC
from .models import MusterSession, MusterEntry

class MusterEntrySerializer(serializers.ModelSerializer):
    pc = serializers.PrimaryKeyRelatedField(queryset=PC.objects.all())
    class Meta:
        model = MusterEntry
        fields = ['id', 'sr_no', 'roll_no', 'pc']

class MusterSessionSerializer(serializers.ModelSerializer):
    lab = serializers.PrimaryKeyRelatedField(queryset=Lab.objects.all())
    entries = MusterEntrySerializer(many=True)
    class Meta:
        model = MusterSession
        fields = ['id', 'date', 'time', 'lab', 'class_name', 'batch', 'created_at', 'entries']
    def create(self, validated_data):
        entries_data = validated_data.pop('entries')
        session = MusterSession.objects.create(**validated_data)
        for entry_data in entries_data:
            MusterEntry.objects.create(session=session, **entry_data)
        return session
    def update(self, instance, validated_data):
        entries_data = validated_data.pop('entries', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if entries_data is not None:
            instance.entries.all().delete()
            for ed in entries_data:
                MusterEntry.objects.create(session=instance, **ed)
        return instance
