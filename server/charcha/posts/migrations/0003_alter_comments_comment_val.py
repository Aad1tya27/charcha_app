# Generated by Django 5.1.1 on 2024-11-01 08:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0002_post_heading'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comments',
            name='comment_val',
            field=models.TextField(),
        ),
    ]