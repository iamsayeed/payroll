from django.test import TestCase
from users.models import CustomUser
from owner.models import Owner


class OwnerModelTestCase(TestCase):

    def setUp(self):
        # Creating a test CustomUser instance for Owner
        self.user = CustomUser.objects.create_user(
            email="owner@example.com", password="password", role="owner"
        )

        # Creating an Owner instance
        self.owner = Owner.objects.create(
            user=self.user,
            permissions="Full Access"
        )

    def test_create_owner(self):
        self.assertEqual(Owner.objects.count(), 1)
        self.assertEqual(self.owner.permissions, "Full Access")
        self.assertEqual(str(self.owner), f"Owner: {self.user.email} ({self.owner.permissions})")

    def test_read_owner(self):
        owner = Owner.objects.get(id=self.owner.id)
        self.assertEqual(owner.permissions, "Full Access")

    def test_update_owner(self):
        self.owner.permissions = "Limited Access"
        self.owner.save()
        updated_owner = Owner.objects.get(id=self.owner.id)
        self.assertEqual(updated_owner.permissions, "Limited Access")

    def test_delete_owner(self):
        self.owner.delete()
        self.assertEqual(Owner.objects.count(), 0)
