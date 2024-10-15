# Generated by Django 5.1.1 on 2024-10-15 06:19

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("message", "0003_remove_message_roomname_message_friendname_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="message",
            name="friendname",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="message_recieved_by",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
