from django.db import models
from labs.models import Lab, PC
from django.contrib.auth.models import User

class MusterSession(models.Model):
    date = models.DateField()
    time = models.TimeField()
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='muster_sessions')
    class_name = models.CharField(max_length=100)
    batch = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Muster {self.lab.name} on {self.date} {self.time}"

class MusterEntry(models.Model):
    session = models.ForeignKey(MusterSession, on_delete=models.CASCADE, related_name='entries')
    sr_no = models.PositiveIntegerField()
    roll_no = models.CharField(max_length=50)
    pc = models.ForeignKey(PC, on_delete=models.CASCADE, related_name='muster_entries')

    class Meta:
        ordering = ['sr_no']
        unique_together = ('session', 'sr_no')

    def __str__(self):
        return f"{self.sr_no}: {self.roll_no} - {self.pc.device_name}"