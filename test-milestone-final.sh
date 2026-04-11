#!/bin/bash
# Re-run milestone test with confirmed working Mailtrap
post_id="cmnq3rmag049f452pl1sw1z1z"
slug="u-rwanda-rwamaganye-ibihano-byafitiwe-rdf-byahengamiye-uruhande-rumwe"

echo "=== TEST: Trigger 100 Milestone ==="
curl -s -H "Authorization: Bearer test-token" http://localhost:3001/api/posts/set-views/$post_id/99 | jq . 2>/dev/null || echo "Set to 99"
sleep 1
curl -s -H "Authorization: Bearer test-token" "http://localhost:3001/api/posts/$slug" | jq '.viewCount' 2>/dev/null || echo "Posted"

echo ""
echo "=== Checking milestone record for 100 ==="
test -f /home/root/backend-api/data/post-view-milestones.json && cat /home/root/backend-api/data/post-view-milestones.json | jq . | head -30 || echo "No milestone file yet"

sleep 2
echo ""
echo "=== TEST: Trigger 200 Milestone ==="
curl -s -H "Authorization: Bearer test-token" http://localhost:3001/api/posts/set-views/$post_id/199 | jq . 2>/dev/null || echo "Set to 199"
sleep 1
curl -s -H "Authorization: Bearer test-token" "http://localhost:3001/api/posts/$slug" | jq '.viewCount' 2>/dev/null || echo "Posted"

echo ""
echo "=== Checking milestone record for 200 ==="
test -f /home/root/backend-api/data/post-view-milestones.json && cat /home/root/backend-api/data/post-view-milestones.json | jq . | head -50 || echo "No milestone file yet"

echo ""
echo "=== Test Complete ==="
echo "Check milestone JSON above for 100 and 200 entries."
echo "Check kwizerajeandedieu250@gmail.com inbox for 2 emails."
