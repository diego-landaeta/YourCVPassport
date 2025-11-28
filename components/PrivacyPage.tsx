import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Privacy Policy | YourCVPassport</title>
        <meta name="description" content="Privacy Policy for YourCVPassport" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-lg dark:prose-invert">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <p className="mb-4">Your privacy is important to us. It is YourCVPassport's policy to respect your privacy regarding any information we may collect from you across our website.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="mb-4">We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. How We Use Information</h2>
          <p className="mb-4">We use the information we collect to provide, operate, and maintain our website, improve, personalize, and expand our website, and understand and analyze how you use our website.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. Log Data</h2>
          <p className="mb-4">We want to inform you that whenever you visit our Service, we collect information that your browser sends to us that is called Log Data. This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser version, pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Cookies</h2>
          <p className="mb-4">Our website uses "cookies" to collect information and to improve our Service. You have the option to either accept or refuse these cookies, and know when a cookie is being sent to your computer.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
