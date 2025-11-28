import React from 'react';
import { Helmet } from 'react-helmet-async';

const TermsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Terms and Conditions | YourCVPassport</title>
        <meta name="description" content="Terms and Conditions for YourCVPassport" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <div className="prose prose-lg dark:prose-invert">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <p className="mb-4">Welcome to YourCVPassport. Please read these terms and conditions carefully before using our service.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. Accounts</h2>
          <p className="mb-4">When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. Intellectual Property</h2>
          <p className="mb-4">The Service and its original content, features, and functionality are and will remain the exclusive property of YourCVPassport and its licensors.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Termination</h2>
          <p className="mb-4">We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
