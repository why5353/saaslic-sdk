from setuptools import setup, find_packages

setup(
    name="saaslic",
    version="0.1.0",
    description="Official Python SDK for LicenseKit — License management for indie developers",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="LicenseKit",
    author_email="hi@saaslic.com",
    url="https://github.com/你的GitHub用户名/saaslic-sdk",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0",
    ],
    python_requires=">=3.7",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries",
    ],
    keywords="license saas sdk indie developer software protection",
)
