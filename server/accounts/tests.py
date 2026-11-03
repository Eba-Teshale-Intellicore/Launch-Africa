# Create your tests here.
from django.contrib.auth import get_user_model
from django.test import TestCase

from accounts.models.profile import Profile
from accounts.services.auth import register_user

User = get_user_model()


class UserModelTests(TestCase):
    def test_user_uses_email_as_login_identifier(self):
        self.assertEqual(User.USERNAME_FIELD, "email")

    def test_create_user_hashes_password(self):
        user = User.objects.create_user(
            username="test_builder_01",
            email="builder01@example.com",
            password="Test-Strong-Password-927!",
        )

        self.assertNotEqual(
            user.password,
            "Test-Strong-Password-927!",
        )
        self.assertTrue(
            user.check_password("Test-Strong-Password-927!")
        )


class RegistrationServiceTests(TestCase):
    def test_registration_creates_user_and_profile(self):
        user, profile = register_user(
            username="test_builder_02",
            email="builder02@example.com",
            password="Test-Strong-Password-927!",
        )

        self.assertTrue(
            User.objects.filter(pk=user.pk).exists()
        )
        self.assertTrue(
            Profile.objects.filter(user=user).exists()
        )
        self.assertEqual(profile.user_id, user.pk)

    def test_registration_normalizes_email(self):
        user, _profile = register_user(
            username="test_builder_03",
            email="  Builder03@Example.com  ",
            password="Test-Strong-Password-927!",
        )

        self.assertEqual(
            user.email,
            "builder03@example.com",
        )
