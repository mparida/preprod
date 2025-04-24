from setuptools import setup, find_packages

setup(
    name="salesforce-rollback",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "gitpython>=3.1.30",
        "lxml>=4.9.1",
        "pandas>=1.5.0"
    ],
    python_requires=">=3.10",
    entry_points={
        "console_scripts": [
            "rollback=rollback_system.main:main"
        ]
    }
)
