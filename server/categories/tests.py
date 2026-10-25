
from django.db import IntegrityError, transaction
from django.test import TestCase

from categories.models.categories import Category
from categories.serializers.categories import CategorySerializer


class CategoryModelTests(TestCase):
    def test_slug_is_generated_automatically(self):
        category = Category.objects.create(
            name="Artificial Intelligence",
        )

        self.assertEqual(
            category.slug,
            "artificial-intelligence",
        )

    def test_slug_collision_gets_unique_suffix(self):
        first = Category.objects.create(
            name="AI Tools",
        )
        second = Category.objects.create(
            name="AI Tools!",
        )

        self.assertEqual(first.slug, "ai-tools")
        self.assertNotEqual(first.slug, second.slug)

    def test_slug_remains_stable_after_rename(self):
        category = Category.objects.create(
            name="AI Tools",
        )
        original_slug = category.slug

        category.name = "Artificial Intelligence Tools"
        category.save()

        category.refresh_from_db()

        self.assertEqual(category.slug, original_slug)

    def test_new_category_is_inactive_by_default(self):
        category = Category.objects.create(
            name="Machine Learning",
        )

        self.assertFalse(category.is_active)

    def test_duplicate_names_are_rejected_case_insensitively(self):
        Category.objects.create(name="Artificial Intelligence")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Category.objects.create(
                    name="ARTIFICIAL INTELLIGENCE",
                )


class CategorySerializerTests(TestCase):
    def test_name_whitespace_is_normalized(self):
        serializer = CategorySerializer(
            data={
                "name": "  AI    Tools  ",
                "description": "",
                "icon_name": "",
            }
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )

        self.assertEqual(
            serializer.validated_data["name"],
            "AI Tools",
        )

    def test_duplicate_name_returns_validation_error(self):
        Category.objects.create(name="AI Tools")

        serializer = CategorySerializer(
            data={"name": "  AI   Tools  "}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_creation_cannot_activate_category(self):
        serializer = CategorySerializer(
            data={
                "name": "Cybersecurity",
                "is_active": True,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("is_active", serializer.errors)

    def test_creation_accepts_inactive_category(self):
        serializer = CategorySerializer(
            data={
                "name": "Cybersecurity",
                "is_active": False,
            }
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )

        category = serializer.save()

        self.assertFalse(category.is_active)
