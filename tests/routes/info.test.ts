import {describe, expect, it, vi} from 'vitest';
import {loader} from '~/routes/info.$section';

function loadSection(section: string, query = vi.fn()) {
  return loader({
    params: {section},
    context: {storefront: {query}},
  } as unknown as Parameters<typeof loader>[0]);
}

describe('information sections', () => {
  it('uses the matching published policy and sanitizes its HTML', async () => {
    const query = vi.fn().mockResolvedValue({
      shop: {
        privacyPolicy: {
          body: '<p>Privacy <strong>details</strong></p><script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a>',
        },
        termsOfService: {body: '<p>Terms details</p>'},
        refundPolicy: {body: '<p>Refund details</p>'},
      },
    });
    const privacy = await loadSection('privacy-policy', query);
    expect(privacy.body).toContain('<strong>details</strong>');
    expect(privacy.body).not.toMatch(/script|javascript:|Terms details/);
    expect((await loadSection('terms-of-service', query)).body).toBe(
      '<p>Terms details</p>',
    );
    expect((await loadSection('refund-policy', query)).body).toBe(
      '<p>Refund details</p>',
    );
  });

  it('distinguishes an unpublished policy from a failed request', async () => {
    const unpublished = await loadSection(
      'refund-policy',
      vi.fn().mockResolvedValue({shop: {refundPolicy: null}}),
    );
    expect(unpublished).toMatchObject({body: null, failed: false});
    const failed = await loadSection(
      'refund-policy',
      vi.fn().mockRejectedValue(new Error('Offline')),
    );
    expect(failed).toMatchObject({body: null, failed: true});
  });

  it('rejects unknown sections before requesting Shopify', async () => {
    const query = vi.fn();
    await expect(loadSection('credits', query)).rejects.toMatchObject({
      status: 404,
    });
    await expect(loadSection('missing', query)).rejects.toMatchObject({
      status: 404,
    });
    await expect(loadSection('toString', query)).rejects.toMatchObject({
      status: 404,
    });
    expect(query).not.toHaveBeenCalled();
  });
});
